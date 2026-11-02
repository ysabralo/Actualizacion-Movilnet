import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Date, JSON, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

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

# MODELOS DE BASE DE DATOS
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
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# ESQUEMAS DE SOLICITUD
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

# 1. VERIFICAR PRIMER INGRESO (P00 + Cédula + Fecha Nacimiento)
@app.post("/api/verify-sap")
def verify_sap(req: VerifySapRequest):
    db = SessionLocal()
    try:
        trabajador = db.query(TrabajadorSAP).filter(TrabajadorSAP.p00 == req.p00.strip().upper()).first()
        if not trabajador:
            raise HTTPException(status_code=401, detail="El P00 ingresado no está registrado en SAP.")
        
        if trabajador.cedula.strip().upper() != req.cedula.strip().upper():
            raise HTTPException(status_code=401, detail="La cédula no coincide con el P00 ingresado.")
        
        if str(trabajador.fecha_nacimiento) != req.fecha_nacimiento:
            raise HTTPException(status_code=401, detail="La fecha de nacimiento no coincide con nuestros registros.")
        
        # Verificar si ya tiene clave creada previamente
        oferta = db.query(OfertaServicio).filter(OfertaServicio.cedula == trabajador.cedula).first()
        has_password = bool(oferta and oferta.clave)

        return {
            "valid": True,
            "has_password": has_password,
            "nombres": trabajador.nombres,
            "apellidos": trabajador.apellidos,
            "cedula": trabajador.cedula
        }
    finally:
        db.close()

# 2. CREAR CLAVE PERSONAL (Primer Ingreso)
@app.post("/api/set-password")
def set_password(req: SetPasswordRequest):
    db = SessionLocal()
    try:
        cedula = req.cedula.strip().upper()
        trabajador = db.query(TrabajadorSAP).filter(TrabajadorSAP.cedula == cedula).first()
        if not trabajador:
            raise HTTPException(status_code=404, detail="Trabajador no encontrado.")
        
        oferta = db.query(OfertaServicio).filter(OfertaServicio.cedula == cedula).first()
        
        initial_data = {
            "datosPersonales": {
                "nombres": trabajador.nombres, "apellidos": trabajador.apellidos, "cedula": trabajador.cedula,
                "rif": "", "lugarNacimiento": "", "fechaNacimiento": "", "nacionalidad": "", "gaceta": "", "edad": "", "sexo": "",
                "grupoSanguineo": "", "estadoCivil": "", "habilidadMotriz": "", "licencia": "", "gradoLicencia": "",
                "tipoVivienda": "", "condicionVivienda": "", "alergico": "", "alergiaDesc": "", "profesion": "",
                "colegiado": "", "nroColegiado": "", "correo": "", "tlfMovil": "", "tlfLocal": "",
                "emergenciaNombre1": "", "emergenciaTelefono1": "", "emergenciaNombre2": "", "emergenciaTelefono2": "",
                "carnetPatria": "", "nroCarnetPatria": "", "estatura": "", "peso": "", "tallaCamisa": "",
                "tallaChemise": "", "tallaFranela": "", "tallaBluejean": "", "tallaBota": "", "tallaZapato": "", "tallaCasco": ""
            },
            "direccion": { "estado": "", "ciudad": "", "municipio": "", "parroquia": "", "urbanizacion": "", "sector": "", "avenida": "", "codigoPostal": "", "inmueble": "", "piso": "", "apto": "" },
            "educacion": { "niveles": [{"nivel": "PRIMARIA","graduado":"","titulo":""},{"nivel": "SECUNDARIA","graduado":"","titulo":""},{"nivel": "TÉCNICA","graduado":"","titulo":""},{"nivel": "UNIVERSITARIA","graduado":"","titulo":""},{"nivel": "POST-GRADO","graduado":"","titulo":""}], "estudiaActualmente": "", "horario": "", "institucion": "", "carrera": "", "nivelAlcanzado": "", "traslado": "" },
            "programasIdiomas": { "idiomas": [{"idioma":"","nivelHablado":"","nivelEscrito":""},{"idioma":"","nivelHablado":"","nivelEscrito":""},{"idioma":"","nivelHablado":"","nivelEscrito":""}], "programas": [{"programa":"","nivelDominio":""},{"programa":"","nivelDominio":""},{"programa":"","nivelDominio":""},{"programa":"","nivelDominio":""},{"programa":"","nivelDominio":""}] },
            "actividadesFamilia": { "dependientes": [{"nombres":"","cedula":"","fechaNacimiento":"","edad":"","parentesco":"","discapacidad":""}], "discapacidadPropia": "", "discapacidadDesc": "", "carnetConapdis": "", "tomaMedicamento": "", "medicamentoCual": "", "medicamentoMotivo": "" },
            "experiencia": { "adminPublica": [{"organismo":"","direccion":"","telefono":"","cargo":"","ingreso":"","egreso":"","motivo":""}], "esJubilado": "", "jubiladoDesc": "", "enProcesoJubilacion": "", "procesoJubilacionDesc": "", "empresaPrivada": [{"empresa":"","direccion":"","telefono":"","cargo":"","ingreso":"","egreso":"","motivo":""}] }
        }

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
                clave=req.clave
            )
            db.add(nueva_oferta)
        
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

# 3. INGRESO HABITUAL (Cédula + Clave Personal)
@app.post("/api/login-clave")
def login_clave(req: LoginClaveRequest):
    db = SessionLocal()
    try:
        cedula = req.cedula.strip().upper()
        oferta = db.query(OfertaServicio).filter(OfertaServicio.cedula == cedula).first()
        
        if not oferta or not oferta.clave:
            raise HTTPException(status_code=401, detail="Cédula no registrada o sin clave creada. Utilice 'Primer Ingreso'.")
        
        if oferta.clave != req.clave:
            raise HTTPException(status_code=401, detail="Contraseña incorrecta.")
        
        trabajador = db.query(TrabajadorSAP).filter(TrabajadorSAP.cedula == cedula).first()
        p00 = trabajador.p00 if trabajador else ""

        return {
            "p00": p00,
            "nombres": oferta.nombres,
            "apellidos": oferta.apellidos,
            "cedula": oferta.cedula,
            "datos_previos": oferta.datos_completos
        }
    finally:
        db.close()

# ENDPOINT PARA GUARDAR DATOS / BORRADOR
@app.post("/api/oferta-servicio")
def save_oferta(data: dict):
    db = SessionLocal()
    try:
        cedula = data["datosPersonales"]["cedula"]
        nombres = data["datosPersonales"]["nombres"]
        apellidos = data["datosPersonales"]["apellidos"]
        
        oferta = db.query(OfertaServicio).filter(OfertaServicio.cedula == cedula).first()
        if oferta:
            oferta.datos_completos = data
            oferta.fecha_actualizacion = datetime.utcnow()
        else:
            nueva_oferta = OfertaServicio(
                cedula=cedula,
                nombres=nombres,
                apellidos=apellidos,
                datos_completos=data
            )
            db.add(nueva_oferta)
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()