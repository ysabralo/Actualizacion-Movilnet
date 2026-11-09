import os
import time
import hmac
import hashlib
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
# CONFIGURACIÓN DE SEGURIDAD (VARIABLES DE ENTORNO)
# ==============================================================================
ADMIN_USER = os.getenv("ADMIN_USER", "archivo_rrhh")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Movilnet2026*")
SECRET_KEY = os.getenv("SECRET_KEY", "movilnet-seguridad-archivo-rrhh-clave-secreta-2026")


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
    """Bitácora histórica inmutable para auditorías internas de RRHH."""
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
    """Genera un token firmado con HMAC-SHA256 y expiración de 48 horas."""
    timestamp = str(int(time.time()) + 172800)
    msg = f"{username}:{timestamp}".encode()
    signature = hmac.new(SECRET_KEY.encode(), msg, hashlib.sha256).hexdigest()
    return f"{username}:{timestamp}:{signature}"


def verify_admin_token(authorization: Optional[str] = Header(None)) -> str:
    """Dependencia de seguridad que valida el token del encabezado Authorization."""
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
    """Extrae la IP real del cliente considerando proxies y balanceadores de Vercel."""
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
    estado_general: str  # 'CONFORME', 'PENDIENTE', 'OBSERVADO'
    soportes: List[Dict[str, Any]]
    observaciones_generales: Optional[str] = ""


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
# ENDPOINTS ADMINISTRATIVOS: ARCHIVO DE PERSONAL (PROTEGIDOS POR TOKEN Y AUDITADOS)
# ==============================================================================
@app.post("/api/admin/login")
def admin_login(req: AdminLoginRequest, request: Request):
    """Autentica al personal de Archivo de RRHH y emite un token de seguridad."""
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
    """Consulta protegida de expedientes con avance documental."""
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
    """Consulta protegida del detalle declarado y la auditoría previa."""
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
            alertas_soportes.append("Póliza concurrentes declaradas")

        return {
            "trabajador": {
                "p00": trabajador.p00 if trabajador else "",
                "cedula": oferta.cedula,
                "nombres": oferta.nombres,
                "apellidos": oferta.apellidos,
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
    """Guarda la auditoría documental con firma de IP y bitácora histórica."""
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

        # Registro inmutable en bitácora de auditoría
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