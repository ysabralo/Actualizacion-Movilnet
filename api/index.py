import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pydantic import BaseModel
from typing import Any, Dict
import datetime

# Configuración de Conexión a PostgreSQL
# Toma la URL de Supabase desde las variables de Vercel
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# TABLA SIMULADA DE SAP/R3
class TrabajadorSAP(Base):
    __tablename__ = "trabajadores_sap"
    p00 = Column(String, primary_key=True, index=True)
    cedula = Column(String, unique=True, index=True)
    nombres = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)

# TABLA DE OFERTAS DE SERVICIO (Formulario)
class OfertaServicio(Base):
    __tablename__ = "ofertas_servicio"
    cedula = Column(String, primary_key=True, index=True)
    nombres = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)
    datos_completos = Column(JSONB, nullable=False) 
    fecha_actualizacion = Column(DateTime, default=datetime.datetime.utcnow)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Actualización de Datos RRHH")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FormularioPayload(BaseModel):
    datosPersonales: Dict[str, Any]
    direccion: Dict[str, Any]
    educacion: Dict[str, Any]
    programasIdiomas: Dict[str, Any]
    actividadesFamilia: Dict[str, Any]
    experiencia: Dict[str, Any]

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ENDPOINT 1: Login y recuperación de borrador
@app.get("/api/trabajador/{p00}")
def obtener_trabajador(p00: str, db: Session = Depends(get_db)):
    # 1. Validar si existe en SAP
    trabajador = db.query(TrabajadorSAP).filter(TrabajadorSAP.p00 == p00.upper()).first()
    if not trabajador:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado en SAP")
    
    # 2. Buscar si ya había guardado datos previamente en su Oferta de Servicio
    registro_guardado = db.query(OfertaServicio).filter(OfertaServicio.cedula == trabajador.cedula).first()
    
    return {
        "p00": trabajador.p00,
        "cedula": trabajador.cedula,
        "nombres": trabajador.nombres,
        "apellidos": trabajador.apellidos,
        "datos_previos": registro_guardado.datos_completos if registro_guardado else None
    }

# ENDPOINT 2: Guardar o Actualizar el Formulario Completo
@app.post("/api/oferta-servicio")
def guardar_oferta(payload: FormularioPayload, db: Session = Depends(get_db)):
    try:
        datos_dict = payload.dict()
        cedula_trabajador = datos_dict["datosPersonales"].get("cedula")
        nombres_trabajador = datos_dict["datosPersonales"].get("nombres")
        apellidos_trabajador = datos_dict["datosPersonales"].get("apellidos")
        
        if not cedula_trabajador:
            raise HTTPException(status_code=400, detail="La cédula es obligatoria")

        registro = db.query(OfertaServicio).filter(OfertaServicio.cedula == cedula_trabajador).first()
        
        if registro:
            # Actualiza registro existente (Upsert)
            registro.nombres = nombres_trabajador
            registro.apellidos = apellidos_trabajador
            registro.datos_completos = datos_dict
            registro.fecha_actualizacion = datetime.datetime.utcnow()
        else:
            # Crea nuevo registro
            nuevo_registro = OfertaServicio(
                cedula=cedula_trabajador,
                nombres=nombres_trabajador,
                apellidos=apellidos_trabajador,
                datos_completos=datos_dict
            )
            db.add(nuevo_registro)
            
        db.commit()
        return {"status": "success", "message": "Actualizado correctamente."}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))