import os
import time
import hmac
import hashlib
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from fastapi import FastAPI, HTTPException, Request, Header, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Date, JSON, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker

app = FastAPI(docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==============================================================================
# CONFIGURACIÓN DE SEGURIDAD Y SERVIDOR SMTP
# ==============================================================================
ADMIN_USER = os.getenv("ADMIN_USER", "archivo_rrhh")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Movilnet2026*")
SECRET_KEY = os.getenv("SECRET_KEY", "movilnet-seguridad-archivo-rrhh-clave-secreta-2026")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER or "no-reply@movilnet.com.ve")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Telecomunicaciones Movilnet - Archivo de Personal")


# ==============================================================================
# MODELOS DE BASE DE DATOS (ORM)
# ==============================================================================
class TrabajadorSAP(Base):
    __tablename__ = "trabajadores_sap"
    p00 = Column(String, primary_key=True, index=True)
    cedula = Column(String, unique=True, index=True)
    nombres = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)
    fecha_nacimiento = Column(Date, nullable=True)


class OfertaServicio(Base):
    __tablename__ = "ofertas_servicio"
    cedula = Column(String, primary_key=True, index=True)
    nombres = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)
    datos_completos = Column(JSON, nullable=False)
    clave = Column(String, nullable=True)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RevisionExpediente(Base):
    __tablename__ = "revisiones_expedientes"
    cedula = Column(String, primary_key=True, index=True)
    analista_revisor = Column(String, nullable=False)
    estado_general = Column(String, nullable=False)  # 'CONFORME', 'PENDIENTE', 'OBSERVADO'
    soportes = Column(JSON, nullable=False)
    observaciones_generales = Column(Text, nullable=True)
    ip_revisor = Column(String, nullable=True)
    fecha_revision = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AuditoriaExpedienteLog(Base):
    __tablename__ = "auditorias_expedientes_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    cedula = Column(String, index=True, nullable=False)
    analista_revisor = Column(String, nullable=False)
    accion = Column(String, nullable=False)
    estado_general = Column(String, nullable=False)
    ip_revisor = Column(String, nullable=True)
    fecha_evento = Column(DateTime, default=datetime.utcnow)
    detalles = Column(JSON, nullable=True)


Base.metadata.create_all(bind=engine)


# ==============================================================================
# SERVICIOS DE SEGURIDAD Y TOKENS
# ==============================================================================
def create_admin_token(username: str) -> str:
    timestamp = str(int(time.time()) + 172800)
    msg = f"{username}:{timestamp}".encode()
    signature = hmac.new(SECRET_KEY.encode(), msg, hashlib.sha256).hexdigest()
    return f"{username}:{timestamp}:{signature}"


def verify_admin_token(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Acceso restringido: Se requiere token de autorización para el Archivo de Personal."
        )
    token = authorization.split(" ")[1]
    parts = token.split(":")
    if len(parts) != 3:
        raise HTTPException(status_code=401, detail="Token con formato inválido.")

    username, timestamp, signature = parts
    try:
        if int(timestamp) < int(time.time()):
            raise HTTPException(status_code=401, detail="Sesión administrativa expirada.")
    except ValueError:
        raise HTTPException(status_code=401, detail="Marca temporal inválida.")

    expected_sig = hmac.new(SECRET_KEY.encode(), f"{username}:{timestamp}".encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected_sig):
        raise HTTPException(status_code=401, detail="Firma de token inválida o alterada.")

    return username


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "IP_NO_DETECTADA"


def calcular_digito_rif(nacionalidad: str, cedula: str) -> str:
    if not cedula:
        return ""
    numeros = "".join(c for c in cedula if c.isdigit())
    if not numeros:
        return ""
    letra = (nacionalidad or "V").strip().upper()
    if letra not in ["V", "E", "J", "P", "G"]:
        letra = "V"

    numeros_centrales = numeros.zfill(8)[-8:]
    valores_letras = {"V": 4, "E": 8, "J": 12, "P": 16, "G": 20}
    suma = valores_letras.get(letra, 4)

    factores = [3, 2, 7, 6, 5, 4, 3, 2]
    for i in range(8):
        suma += int(numeros_centrales[i]) * factores[i]

    residuo = suma % 11
    resta = 11 - residuo
    digito = 0 if resta in (10, 11) else resta
    return f"{letra}-{numeros_centrales}-{digito}"


def generar_plantilla_inicial(trabajador: TrabajadorSAP) -> dict:
    nac = "V"
    rif = calcular_digito_rif(nac, trabajador.cedula)
    fnac = str(trabajador.fecha_nacimiento) if trabajador.fecha_nacimiento else ""

    return {
        "datosPersonales": {
            "nombres": (trabajador.nombres or "").upper(),
            "apellidos": (trabajador.apellidos or "").upper(),
            "cedula": (trabajador.cedula or "").upper(),
            "nacionalidad": nac,
            "rif": rif,
            "lugarNacimiento": "",
            "fechaNacimiento": fnac,
            "gaceta": "",
            "edad": "",
            "sexo": "",
            "grupoSanguineo": "",
            "estadoCivil": "",
            "habilidadMotriz": "",
            "licencia": "",
            "gradoLicencia": "",
            "tipoVivienda": "",
            "condicionVivienda": "",
            "alergico": "NO",
            "alergiaDesc": "",
            "profesion": "",
            "ocupacion": "",
            "colegiado": "NO",
            "nroColegiado": "",
            "correo": "",
            "tlfMovil": "",
            "tlfLocal": "",
            "unidadAdscripcion": "",
            "gerenciaGeneral": "",
            "region": "",
            "estadoTrabajo": "",
            "emergenciaNombre1": "",
            "emergenciaTelefono1": "",
            "emergenciaNombre2": "",
            "emergenciaTelefono2": "",
            "carnetPatria": "NO",
            "nroCarnetPatria": "",
            "estatura": "",
            "peso": "",
            "tallaCamisa": "",
            "tallaChemise": "",
            "tallaFranela": "",
            "tallaBluejean": "",
            "tallaBota": "",
            "tallaZapato": "",
            "tallaCasco": "",
        },
        "direccion": {
            "estado": "",
            "ciudad": "",
            "municipio": "",
            "parroquia": "",
            "urbanizacion": "",
            "avenida": "",
            "codigoPostal": "",
            "tipoInmueble": "CASA",
            "inmueble": "",
            "piso": "",
            "apto": "",
            "puntoReferencia": "",
        },
        "educacion": {
            "niveles": [
                {"nivel": "PRIMARIA", "graduado": "", "titulo": ""},
                {"nivel": "SECUNDARIA", "graduado": "", "titulo": ""},
                {"nivel": "TÉCNICA", "graduado": "", "titulo": ""},
                {"nivel": "UNIVERSITARIA", "graduado": "", "titulo": ""},
                {"nivel": "POST-GRADO", "graduado": "", "titulo": ""},
            ],
            "estudiaActualmente": "NO",
            "horario": "",
            "institucion": "",
            "carrera": "",
            "nivelAlcanzado": "",
            "traslado": "",
        },
        "programasIdiomas": {
            "idiomas": [
                {"idioma": "", "nivelHablado": "", "nivelEscrito": ""},
                {"idioma": "", "nivelHablado": "", "nivelEscrito": ""},
                {"idioma": "", "nivelHablado": "", "nivelEscrito": ""},
            ],
            "programas": [
                {"programa": "", "nivelDominio": ""},
                {"programa": "", "nivelDominio": ""},
                {"programa": "", "nivelDominio": ""},
                {"programa": "", "nivelDominio": ""},
                {"programa": "", "nivelDominio": ""},
            ],
        },
        "actividadesFamilia": {
            "dependientes": [
                {
                    "nombres": "",
                    "cedula": "",
                    "fechaNacimiento": "",
                    "edad": "",
                    "parentesco": "",
                    "viveConUsted": "SÍ",
                    "lugarResidencia": "",
                    "carnetConapdis": "",
                    "tipoDiscapacidad": "",
                    "especifique": "",
                    "grado": "",
                }
            ],
            "discapacidadPropia": "NO",
            "carnetConapdis": "",
            "tipoDiscapacidad": "",
            "discapacidadDesc": "",
            "gradoDiscapacidad": "",
            "tomaMedicamento": "NO",
            "medicamentoCual": "",
            "medicamentoMotivo": "",
        },
        "experiencia": {
            "adminPublica": [
                {"organismo": "", "direccion": "", "telefono": "", "cargo": "", "ingreso": "", "egreso": "", "motivo": ""}
            ],
            "esJubilado": "NO",
            "jubiladoDesc": "",
            "enProcesoJubilacion": "NO",
            "procesoJubilacionDesc": "",
            "empresaPrivada": [
                {"empresa": "", "direccion": "", "telefono": "", "cargo": "", "ingreso": "", "egreso": "", "motivo": ""}
            ],
        },
        "hcmPolizas": {
            "estaEmbarazada": "NO",
            "mesesEmbarazo": "",
            "familiarMovilnet": "NO",
            "familiarMovilnetParentesco": "",
            "tieneOtroSeguro": "NO",
            "segurosVigentes": [
                {"empresaSeguros": "", "nroPoliza": "", "sumaAseguradora": "", "deducible": ""}
            ],
            "beneficiariosFallecimiento": [
                {"nombres": "", "cedula": "", "sexo": "", "parentesco": "", "porcentaje": ""}
            ],
            "declaracionSalud": {
                "p1": "NO", "p2": "NO", "p3": "NO", "p4": "NO", "p5": "NO",
                "p6": "NO", "p7": "NO", "p8": "NO", "p9": "NO", "p10": "NO",
                "p11": "NO", "p12": "NO", "p13": "NO", "p14": "NO", "p15": "NO",
                "detallesEnfermedades": "",
            },
            "lugarDeclaracion": "",
            "fechaDeclaracion": "",
        },
    }


# ==============================================================================
# SERVICIO DE ENVÍO DE CORREO (SMTP)
# ==============================================================================
def enviar_correo_smtp(destinatario: str, asunto: str, cuerpo_html: str):
    if not SMTP_USER or not SMTP_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="Servidor de correo no configurado. Asegúrese de definir las variables SMTP_USER y SMTP_PASSWORD en el entorno."
        )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = asunto
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM}>"
    msg["To"] = destinatario

    part_html = MIMEText(cuerpo_html, "html", "utf-8")
    msg.attach(part_html)

    try:
        if SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15)
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, [destinatario], msg.as_string())
            server.quit()
        else:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, [destinatario], msg.as_string())
            server.quit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al enviar el correo por SMTP: {str(e)}")


def construir_plantilla_correo_recaudos(
    nombre_trabajador: str,
    cedula_trabajador: str,
    soportes_pendientes: List[Dict[str, Any]],
    analista: str,
    mensaje_adicional: Optional[str] = ""
) -> str:
    filas_html = ""
    for item in soportes_pendientes:
        est = item.get("estado", "PENDIENTE")
        color_badge = "#B45309" if est == "PENDIENTE" else "#B91C1C"
        bg_badge = "#FEF3C7" if est == "PENDIENTE" else "#FEE2E2"
        obs = item.get("obs", "").strip() or "Pendiente por consignar en físico."

        filas_html += f"""
        <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 10px 12px; font-weight: 600; color: #1F2937;">
                {item.get('documento', 'Documento')}
                <br><span style="font-size: 11px; font-weight: normal; color: #6B7280;">Pestaña: {item.get('categoria', 'Expediente')}</span>
            </td>
            <td style="padding: 10px 12px; text-align: center;">
                <span style="display: inline-block; padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; color: {color_badge}; background-color: {bg_badge};">
                    {est}
                </span>
            </td>
            <td style="padding: 10px 12px; font-size: 12px; color: #374151;">
                {obs}
            </td>
        </tr>
        """

    bloque_adicional = ""
    if mensaje_adicional and mensaje_adicional.strip():
        bloque_adicional = f"""
        <div style="margin-top: 15px; padding: 12px; background-color: #EFF6FF; border-left: 4px solid #2563EB; border-radius: 4px;">
            <strong style="color: #1E40AF; font-size: 12px; display: block; margin-bottom: 4px;">Nota adicional del analista:</strong>
            <p style="margin: 0; font-size: 13px; color: #1E3A8A;">{mensaje_adicional.strip()}</p>
        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, Helvetica, sans-serif; background-color: #F3F4F6; margin: 0; padding: 20px; color: #1F2937;">
        <div style="max-width: 650px; margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; border: 1px solid #E5E7EB; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #002B66; padding: 20px; text-align: center; color: #FFFFFF;">
                <h1 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">TELECOMUNICACIONES MOVILNET C.A.</h1>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #93C5FD;">Gerencia General de Talento Humano | Archivo de Personal</p>
            </div>
            
            <div style="padding: 24px;">
                <h2 style="font-size: 16px; color: #002B66; margin-top: 0;">Notificación de Recaudos Pendientes en Expediente</h2>
                <p style="font-size: 14px; line-height: 1.5; margin-bottom: 12px;">
                    Estimado(a) <strong>{nombre_trabajador}</strong>,<br>
                    Cédula de Identidad: <strong>{cedula_trabajador}</strong>
                </p>
                <p style="font-size: 13px; line-height: 1.5; color: #4B5563; margin-bottom: 16px;">
                    Reciba un cordial saludo. Con motivo de la auditoría y cotejo documental de su expediente de personal, se le informa que se han identificado los siguientes recaudos con estatus pendiente o con necesidad de renovación:
                </p>

                <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; border: 1px solid #E5E7EB;">
                    <thead>
                        <tr style="background-color: #F9FAFB; border-bottom: 2px solid #E5E7EB; color: #374151;">
                            <th style="padding: 10px 12px; text-align: left;">Soporte Requerido</th>
                            <th style="padding: 10px 12px; text-align: center; width: 110px;">Estatus</th>
                            <th style="padding: 10px 12px; text-align: left;">Detalle / Observación</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filas_html}
                    </tbody>
                </table>

                {bloque_adicional}

                <div style="margin-top: 20px; padding: 14px; background-color: #FEF3C7; border-left: 4px solid #D97706; border-radius: 4px;">
                    <strong style="color: #92400E; font-size: 13px; display: block; margin-bottom: 4px;">Lugar de Consignación:</strong>
                    <p style="margin: 0; font-size: 12px; color: #78350F; line-height: 1.4;">
                        Le instamos a consignar los documentos originales o copias legibles solicitadas ante la oficina de <strong>Atención al Trabajador</strong> en su sede correspondiente, a la brevedad posible, a efectos de culminar la regularización de su expediente laboral.
                    </p>
                </div>

                <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280;">
                    <p style="margin: 0;">Atentamente,</p>
                    <p style="margin: 4px 0 0 0; font-weight: bold; color: #1F2937;">{analista}</p>
                    <p style="margin: 2px 0 0 0; color: #4B5563;">Archivo de Personal | Gestión de Talento Humano</p>
                </div>
            </div>

            <div style="background-color: #F9FAFB; padding: 12px 20px; text-align: center; font-size: 11px; color: #9CA3AF; border-top: 1px solid #E5E7EB;">
                Este es un mensaje institucional automático generado por el Sistema de Archivo de Personal de Telecomunicaciones Movilnet C.A.
            </div>
        </div>
    </body>
    </html>
    """


# ==============================================================================
# ESQUEMAS PYDANTIC
# ==============================================================================
class VerifySapRequest(BaseModel):
    p00: str
    cedula: str
    fecha_nacimiento: str


class SetPasswordRequest(BaseModel):
    p00: str
    cedula: str
    clave: str


class LoginClaveRequest(BaseModel):
    cedula: str
    clave: str


class AdminLoginRequest(BaseModel):
    usuario: str
    password: str


class RevisionExpedienteRequest(BaseModel):
    cedula_trabajador: str
    analista_revisor: str
    estado_general: str
    soportes: List[Dict[str, Any]]
    observaciones_generales: Optional[str] = ""


class NotificarTrabajadorRequest(BaseModel):
    cedula_trabajador: str
    correo_destino: str
    analista_revisor: str
    soportes_pendientes: List[Dict[str, Any]]
    mensaje_adicional: Optional[str] = ""


# ==============================================================================
# ENDPOINTS PÚBLICOS / TRABAJADOR
# ==============================================================================
@app.post("/api/verify-sap")
def verify_sap(req: VerifySapRequest):
    db = SessionLocal()
    try:
        p00_raw = req.p00.strip().upper()
        p00_alternativo = p00_raw[3:] if p00_raw.startswith("P00") else f"P00{p00_raw}"

        trabajador = (
            db.query(TrabajadorSAP)
            .filter((TrabajadorSAP.p00 == p00_raw) | (TrabajadorSAP.p00 == p00_alternativo))
            .first()
        )
        if not trabajador:
            raise HTTPException(status_code=401, detail="El número de personal ingresado no está registrado en SAP.")

        if trabajador.cedula.strip().upper() != req.cedula.strip().upper():
            raise HTTPException(status_code=401, detail="La cédula no coincide con el número de personal.")

        if str(trabajador.fecha_nacimiento) != req.fecha_nacimiento.strip():
            raise HTTPException(status_code=401, detail="La fecha de nacimiento no coincide con nuestros registros.")

        oferta = db.query(OfertaServicio).filter(OfertaServicio.cedula == trabajador.cedula).first()
        has_password = bool(oferta and oferta.clave)

        return {
            "valid": True,
            "has_password": has_password,
            "nombres": trabajador.nombres,
            "apellidos": trabajador.apellidos,
            "cedula": trabajador.cedula,
        }
    finally:
        db.close()


@app.post("/api/set-password")
def set_password(req: SetPasswordRequest):
    db = SessionLocal()
    try:
        cedula = req.cedula.strip().upper()
        trabajador = db.query(TrabajadorSAP).filter(TrabajadorSAP.cedula == cedula).first()
        if not trabajador:
            raise HTTPException(status_code=404, detail="Trabajador no encontrado.")

        oferta = db.query(OfertaServicio).filter(OfertaServicio.cedula == cedula).first()
        initial_data = generar_plantilla_inicial(trabajador)

        if oferta:
            oferta.clave = req.clave
            if not oferta.datos_completos:
                oferta.datos_completos = initial_data
        else:
            nueva_oferta = OfertaServicio(
                cedula=cedula,
                nombres=trabajador.nombres,
                apellidos=trabajador.apellidos,
                datos_completos=initial_data,
                clave=req.clave,
            )
            db.add(nueva_oferta)

        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.post("/api/login-clave")
def login_clave(req: LoginClaveRequest):
    db = SessionLocal()
    try:
        cedula = req.cedula.strip().upper()
        oferta = db.query(OfertaServicio).filter(OfertaServicio.cedula == cedula).first()

        if not oferta or not oferta.clave:
            raise HTTPException(
                status_code=401,
                detail="Cédula no registrada o sin clave creada. Utilice 'Primer Ingreso'.",
            )

        if oferta.clave != req.clave:
            raise HTTPException(status_code=401, detail="Contraseña incorrecta.")

        trabajador = db.query(TrabajadorSAP).filter(TrabajadorSAP.cedula == cedula).first()
        p00 = trabajador.p00 if trabajador else ""

        datos_previos = oferta.datos_completos or {}
        if "hcmPolizas" not in datos_previos:
            plantilla = generar_plantilla_inicial(trabajador) if trabajador else {}
            datos_previos["hcmPolizas"] = plantilla.get("hcmPolizas", {})

        return {
            "p00": p00,
            "nombres": oferta.nombres,
            "apellidos": oferta.apellidos,
            "cedula": oferta.cedula,
            "datos_previos": datos_previos,
        }
    finally:
        db.close()


@app.post("/api/oferta-servicio")
def save_oferta(data: dict):
    db = SessionLocal()
    try:
        dp = data.get("datosPersonales", {})
        cedula = (dp.get("cedula") or "").strip().upper()
        nombres = (dp.get("nombres") or "").strip().upper()
        apellidos = (dp.get("apellidos") or "").strip().upper()

        if not cedula:
            raise HTTPException(status_code=400, detail="Cédula no proporcionada.")

        nac = dp.get("nacionalidad") or "V"
        if not dp.get("rif"):
            data["datosPersonales"]["rif"] = calcular_digito_rif(nac, cedula)

        oferta = db.query(OfertaServicio).filter(OfertaServicio.cedula == cedula).first()
        if oferta:
            oferta.nombres = nombres or oferta.nombres
            oferta.apellidos = apellidos or oferta.apellidos
            oferta.datos_completos = data
            oferta.fecha_actualizacion = datetime.utcnow()
        else:
            nueva_oferta = OfertaServicio(
                cedula=cedula,
                nombres=nombres,
                apellidos=apellidos,
                datos_completos=data,
            )
            db.add(nueva_oferta)

        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


# ==============================================================================
# ENDPOINTS ADMINISTRATIVOS: ARCHIVO DE PERSONAL
# ==============================================================================
@app.post("/api/admin/login")
def admin_login(req: AdminLoginRequest, request: Request):
    ip_cliente = get_client_ip(request)
    if req.usuario.strip() != ADMIN_USER or req.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=401,
            detail="Credenciales administrativas incorrectas. Acceso exclusivo para Archivo de RRHH."
        )

    token = create_admin_token(req.usuario.strip())
    return {
        "status": "success",
        "token": token,
        "usuario": req.usuario.strip(),
        "rol": "ARCHIVO_RRHH",
        "ip": ip_cliente
    }


@app.get("/api/admin/expedientes")
def listar_expedientes(
    estado_filtro: Optional[str] = Query(None),
    admin_user: str = Depends(verify_admin_token)
):
    db = SessionLocal()
    try:
        ofertas = db.query(OfertaServicio).order_by(OfertaServicio.fecha_actualizacion.desc()).all()
        resultado = []

        for of in ofertas:
            trabajador = db.query(TrabajadorSAP).filter(TrabajadorSAP.cedula == of.cedula).first()
            p00 = trabajador.p00 if trabajador else ""
            revision = db.query(RevisionExpediente).filter(RevisionExpediente.cedula == of.cedula).first()

            estado_exp = revision.estado_general if revision else "SIN_REVISAR"

            if estado_filtro and estado_filtro != "TODOS" and estado_exp != estado_filtro:
                continue

            resultado.append({
                "cedula": of.cedula,
                "nombres": of.nombres,
                "apellidos": of.apellidos,
                "p00": p00,
                "fecha_actualizacion": of.fecha_actualizacion.isoformat() if of.fecha_actualizacion else None,
                "estado_expediente": estado_exp,
                "analista_revisor": revision.analista_revisor if revision else None,
                "fecha_revision": revision.fecha_revision.isoformat() if revision else None,
                "ip_revisor": revision.ip_revisor if revision else None,
            })

        return {"total": len(resultado), "expedientes": resultado}
    finally:
        db.close()


@app.get("/api/admin/expediente/{cedula}")
def obtener_expediente(
    cedula: str,
    admin_user: str = Depends(verify_admin_token)
):
    db = SessionLocal()
    try:
        cedula_clean = cedula.strip().upper()
        oferta = db.query(OfertaServicio).filter(OfertaServicio.cedula == cedula_clean).first()
        if not oferta:
            raise HTTPException(status_code=404, detail="El trabajador no posee datos guardados en el sistema.")

        trabajador = db.query(TrabajadorSAP).filter(TrabajadorSAP.cedula == cedula_clean).first()
        revision = db.query(RevisionExpediente).filter(RevisionExpediente.cedula == cedula_clean).first()

        dp = (oferta.datos_completos or {}).get("datosPersonales", {})
        af = (oferta.datos_completos or {}).get("actividadesFamilia", {})
        hcm = (oferta.datos_completos or {}).get("hcmPolizas", {})

        alertas_soportes = []
        if af.get("discapacidadPropia") == "SÍ":
            alertas_soportes.append("Carnet CONAPDIS del Trabajador (Declaró discapacidad propia)")

        dependientes = af.get("dependientes", [])
        for idx, dep in enumerate(dependientes):
            parentesco = dep.get("parentesco", "")
            if "DISCAPACIDAD" in parentesco:
                alertas_soportes.append(f"Carnet CONAPDIS de familiar #{idx + 1} ({parentesco})")
            if dep.get("viveConUsted") == "NO":
                alertas_soportes.append(f"Comprobante de residencia foránea familiar #{idx + 1}")

        if hcm.get("tieneOtroSeguro") == "SÍ":
            alertas_soportes.append("Póliza concurrente declarada")

        return {
            "trabajador": {
                "p00": trabajador.p00 if trabajador else "",
                "cedula": oferta.cedula,
                "nombres": oferta.nombres,
                "apellidos": oferta.apellidos,
                "correo": dp.get("correo", ""),
                "unidadAdscripcion": dp.get("unidadAdscripcion", ""),
                "gerenciaGeneral": dp.get("gerenciaGeneral", ""),
                "region": dp.get("region", ""),
                "estadoTrabajo": dp.get("estadoTrabajo", ""),
                "fecha_actualizacion": oferta.fecha_actualizacion.isoformat() if oferta.fecha_actualizacion else None,
            },
            "datos_declarados": oferta.datos_completos,
            "alertas_soportes": alertas_soportes,
            "revision_previa": {
                "analista_revisor": revision.analista_revisor if revision else "",
                "estado_general": revision.estado_general if revision else "SIN_REVISAR",
                "soportes": revision.soportes if revision else [],
                "observaciones_generales": revision.observaciones_generales if revision else "",
                "ip_revisor": revision.ip_revisor if revision else "",
                "fecha_revision": revision.fecha_revision.isoformat() if revision else None,
            } if revision else None,
        }
    finally:
        db.close()


@app.post("/api/admin/expediente/guardar-revision")
def guardar_revision_expediente(
    req: RevisionExpedienteRequest,
    request: Request,
    admin_user: str = Depends(verify_admin_token)
):
    db = SessionLocal()
    try:
        cedula_clean = req.cedula_trabajador.strip().upper()
        ip_revisor = get_client_ip(request)
        analista = req.analista_revisor.strip().upper() or admin_user.upper()

        revision = db.query(RevisionExpediente).filter(RevisionExpediente.cedula == cedula_clean).first()
        if revision:
            revision.analista_revisor = analista
            revision.estado_general = req.estado_general.strip().upper()
            revision.soportes = req.soportes
            revision.observaciones_generales = req.observaciones_generales
            revision.ip_revisor = ip_revisor
            revision.fecha_revision = datetime.utcnow()
        else:
            nueva_revision = RevisionExpediente(
                cedula=cedula_clean,
                analista_revisor=analista,
                estado_general=req.estado_general.strip().upper(),
                soportes=req.soportes,
                observaciones_generales=req.observaciones_generales,
                ip_revisor=ip_revisor,
            )
            db.add(nueva_revision)

        log_auditoria = AuditoriaExpedienteLog(
            cedula=cedula_clean,
            analista_revisor=analista,
            accion="GUARDAR_REVISION_SOPORTES",
            estado_general=req.estado_general.strip().upper(),
            ip_revisor=ip_revisor,
            detalles={
                "observaciones": req.observaciones_generales,
                "total_items": len(req.soportes),
            }
        )
        db.add(log_auditoria)

        db.commit()
        return {
            "status": "success",
            "mensaje": "Auditoría de expediente y registro de trazabilidad guardados exitosamente.",
            "ip_registrada": ip_revisor
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.post("/api/admin/expediente/notificar-recaudos")
def notificar_recaudos_trabajador(
    req: NotificarTrabajadorRequest,
    request: Request,
    admin_user: str = Depends(verify_admin_token)
):
    """Envía un correo con los recaudos pendientes o ilegibles al correo personal del trabajador."""
    db = SessionLocal()
    try:
        cedula_clean = req.cedula_trabajador.strip().upper()
        correo_destino = req.correo_destino.strip().lower()

        if not correo_destino or "@" not in correo_destino:
            raise HTTPException(status_code=400, detail="El correo electrónico del trabajador no es válido.")

        oferta = db.query(OfertaServicio).filter(OfertaServicio.cedula == cedula_clean).first()
        if not oferta:
            raise HTTPException(status_code=404, detail="Trabajador no encontrado en el sistema.")

        nombre_completo = f"{oferta.nombres} {oferta.apellidos}".upper()

        # Filtrar recaudos no conformes
        pendientes = [
            item for item in req.soportes_pendientes
            if item.get("estado") in ["PENDIENTE", "ILEGIBLE"]
        ]

        if not pendientes:
            raise HTTPException(
                status_code=400, 
                detail="No existen recaudos con estatus 'PENDIENTE' o 'ILEGIBLE' para notificar a este trabajador."
            )

        asunto = f"Notificación de Recaudos Pendientes - Expediente RRHH (C.I. {cedula_clean})"
        analista = req.analista_revisor.strip().upper() or admin_user.upper()

        cuerpo_html = construir_plantilla_correo_recaudos(
            nombre_trabajador=nombre_completo,
            cedula_trabajador=cedula_clean,
            soportes_pendientes=pendientes,
            analista=analista,
            mensaje_adicional=req.mensaje_adicional
        )

        enviar_correo_smtp(
            destinatario=correo_destino,
            asunto=asunto,
            cuerpo_html=cuerpo_html
        )

        # Registro de trazabilidad
        ip_revisor = get_client_ip(request)
        log_notif = AuditoriaExpedienteLog(
            cedula=cedula_clean,
            analista_revisor=analista,
            accion="ENVIO_NOTIFICACION_CORREO",
            estado_general="PENDIENTE",
            ip_revisor=ip_revisor,
            detalles={
                "correo_destino": correo_destino,
                "recaudos_notificados": [p.get("documento") for p in pendientes],
                "mensaje_adicional": req.mensaje_adicional,
            }
        )
        db.add(log_notif)
        db.commit()

        return {
            "status": "success",
            "mensaje": f"Notificación enviada exitosamente a {correo_destino}.",
            "total_recaudos": len(pendientes)
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()