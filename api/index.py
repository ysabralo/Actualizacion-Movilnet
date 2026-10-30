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
    fecha_ingreso = Column(Date, nullable=True) # NUEVA COLUMNA

class OfertaServicio(Base):
    __tablename__ = "ofertas_servicio"
    cedula = Column(String, primary_key=True, index=True)
    nombres = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)
    datos_completos = Column(JSON, nullable=False)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# ESQUEMA PARA RECIBIR LOS 3 DATOS DE LOGIN
class AuthRequest(BaseModel):
    p00: str
    cedula: str
    fecha_ingreso: str

# ENDPOINT DE LOGIN CON TRIPLE VALIDACIÓN
@app.post("/api/login")
def login(req: AuthRequest):
    db = SessionLocal()
    try:
        # 1. Validar P00
        trabajador = db.query(TrabajadorSAP).filter(TrabajadorSAP.p00 == req.p00.strip().upper()).first()
        if not trabajador:
            raise HTTPException(status_code=401, detail="El P00 ingresado no está registrado en SAP.")
        
        # 2. Validar Cédula
        if trabajador.cedula.strip().upper() != req.cedula.strip().upper():
            raise HTTPException(status_code=401, detail="La cédula no coincide con el P00 ingresado.")
        
        # 3. Validar Fecha de Ingreso
        if str(trabajador.fecha_ingreso) != req.fecha_ingreso:
            raise HTTPException(status_code=401, detail="La fecha de ingreso no coincide con nuestros registros.")
        
        # Si pasó las 3 validaciones, buscamos si tiene borrador guardado
        oferta = db.query(OfertaServicio).filter(OfertaServicio.cedula == trabajador.cedula).first()
        datos_previos = oferta.datos_completos if oferta else None
        
        return {
            "nombres": trabajador.nombres,
            "apellidos": trabajador.apellidos,
            "cedula": trabajador.cedula,
            "datos_previos": datos_previos
        }
    finally:
        db.close()

# ENDPOINT PARA GUARDAR DATOS
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