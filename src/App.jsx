import React, { useState } from 'react';
import { Save, CheckCircle, AlertCircle, Plus, Trash2, Search, UserCheck, ChevronRight, ChevronLeft, Lock, Calendar, CreditCard, Key, ShieldPlus, FileText } from 'lucide-react';

const App = () => {
  // ================= ESTADOS Y AUTENTICACIÓN =================
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginStep, setLoginStep] = useState('login'); // 'login' | 'verifyFirst' | 'createPassword'
  
  // Campos de Login Habitual (Cédula + Clave)
  const [loginCedula, setLoginCedula] = useState('');
  const [loginClave, setLoginClave] = useState('');
  
  // Campos de Primer Ingreso (P00 + Cédula + Fecha Nacimiento)
  const [p00Input, setP00Input] = useState('');
  const [cedulaInput, setCedulaInput] = useState('');
  const [fechaNacimientoInput, setFechaNacimientoInput] = useState('');
  
  // Campos para crear clave nueva
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSearching, setIsSearching] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const [activeTab, setActiveTab] = useState(0);
  const [maxUnlockedTab, setMaxUnlockedTab] = useState(0);
  const [validationErrors, setValidationErrors] = useState([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const [formData, setFormData] = useState({
    datosPersonales: {
      nombres: '', apellidos: '', cedula: '', rif: '', lugarNacimiento: '', fechaNacimiento: '', 
      nacionalidad: '', gaceta: '', edad: '', sexo: '', grupoSanguineo: '', estadoCivil: '', habilidadMotriz: '',
      licencia: '', gradoLicencia: '', tipoVivienda: '', condicionVivienda: '', alergico: '', alergiaDesc: '',
      profesion: '', ocupacion: '', colegiado: '', nroColegiado: '', correo: '', tlfMovil: '', tlfLocal: '',
      unidadAdscripcion: '', gerenciaGeneral: '', region: '', estadoTrabajo: '',
      emergenciaNombre1: '', emergenciaTelefono1: '', emergenciaNombre2: '', emergenciaTelefono2: '',
      carnetPatria: '', nroCarnetPatria: '', estatura: '', peso: '', tallaCamisa: '',
      tallaChemise: '', tallaFranela: '', tallaBluejean: '', tallaBota: '', tallaZapato: '', tallaCasco: ''
    },
    direccion: {
      estado: '', ciudad: '', municipio: '', parroquia: '', urbanizacion: '',
      sector: '', avenida: '', codigoPostal: '', inmueble: '', piso: '', apto: ''
    },
    educacion: {
      niveles: [
        { nivel: 'PRIMARIA', graduado: '', titulo: '' },
        { nivel: 'SECUNDARIA', graduado: '', titulo: '' },
        { nivel: 'TÉCNICA', graduado: '', titulo: '' },
        { nivel: 'UNIVERSITARIA', graduado: '', titulo: '' },
        { nivel: 'POST-GRADO', graduado: '', titulo: '' }
      ],
      estudiaActualmente: '', horario: '', institucion: '', carrera: '', nivelAlcanzado: '', traslado: ''
    },
    programasIdiomas: {
      idiomas: [{ idioma: '', nivelHablado: '', nivelEscrito: '' }, { idioma: '', nivelHablado: '', nivelEscrito: '' }, { idioma: '', nivelHablado: '', nivelEscrito: '' }],
      programas: [{ programa: '', nivelDominio: '' }, { programa: '', nivelDominio: '' }, { programa: '', nivelDominio: '' }, { programa: '', nivelDominio: '' }, { programa: '', nivelDominio: '' }]
    },
    actividadesFamilia: {
      dependientes: [{ nombres: '', cedula: '', fechaNacimiento: '', edad: '', parentesco: '', discapacidad: '' }],
      discapacidadPropia: '', discapacidadDesc: '', carnetConapdis: '', tomaMedicamento: '', medicamentoCual: '', medicamentoMotivo: ''
    },
    experiencia: {
      adminPublica: [{ organismo: '', direccion: '', telefono: '', cargo: '', ingreso: '', egreso: '', motivo: '' }],
      esJubilado: '', jubiladoDesc: '', enProcesoJubilacion: '', procesoJubilacionDesc: '',
      empresaPrivada: [{ empresa: '', direccion: '', telefono: '', cargo: '', ingreso: '', egreso: '', motivo: '' }]
    },
    hcmPolizas: {
      familiarMovilnet: 'NO',
      familiarMovilnetParentesco: '',
      tieneOtroSeguro: 'NO',
      segurosVigentes: [{ empresaSeguros: '', nroPoliza: '', sumaAseguradora: '', deducible: '' }],
      beneficiariosFallecimiento: [{ nombres: '', cedula: '', sexo: '', parentesco: '', porcentaje: '' }],
      declaracionSalud: {
        p1: 'NO', p2: 'NO', p3: 'NO', p4: 'NO', p5: 'NO',
        p6: 'NO', p7: 'NO', p8: 'NO', p9: 'NO', p10: 'NO',
        p11: 'NO', p12: 'NO', p13: 'NO', p14: 'NO', p15: 'NO',
        detallesEnfermedades: ''
      },
      lugarDeclaracion: '',
      fechaDeclaracion: ''
    }
  });

  const tabs = ["1. Datos Personales", "2. Dirección", "3. Educación e Idiomas", "4. Carga Familiar", "5. Experiencia", "6. HCM y Pólizas"];

  // ================= ALGORITMO RIF (MÓDULO 11) =================
  const calcularRifAutomatico = (nacionalidad, cedula) => {
    if (!cedula) return '';
    const numerosLimpios = cedula.replace(/\D/g, '');
    if (numerosLimpios.length === 0) return '';

    const letraInicial = (nacionalidad || 'V').toUpperCase();
    const numerosCentrales = numerosLimpios.padStart(8, '0').slice(-8);

    const valoresLetras = { 'V': 4, 'E': 8, 'J': 12, 'P': 16, 'G': 20 };
    let sumaTotal = valoresLetras[letraInicial] || 4;

    const factores = [3, 2, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 8; i++) {
      sumaTotal += parseInt(numerosCentrales[i], 10) * factores[i];
    }

    const residuo = sumaTotal % 11;
    const resta = 11 - residuo;
    const digitoVerificador = (resta === 10 || resta === 11) ? 0 : resta;

    return `${letraInicial}-${numerosCentrales}-${digitoVerificador}`;
  };

  // ================= FUNCIONES =================
  const convertDataToUppercase = (data) => {
    if (typeof data !== 'object' || data === null) return data;
    if (Array.isArray(data)) return data.map(convertDataToUppercase);
    const newData = {};
    for (const key in data) {
      if (key === 'correo' && typeof data[key] === 'string') {
        newData[key] = data[key].toLowerCase();
      } else if (typeof data[key] === 'string') {
        newData[key] = data[key].toUpperCase();
      } else {
        newData[key] = convertDataToUppercase(data[key]);
      }
    }
    return newData;
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '';
    const hoy = new Date();
    const cumpleanos = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - cumpleanos.getFullYear();
    const m = hoy.getMonth() - cumpleanos.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) edad--;
    return edad.toString();
  };

  const handleInputChange = (section, field, value) => {
    let finalValue = value;
    if (typeof value === 'string') {
      finalValue = field === 'correo' ? value.toLowerCase() : value.toUpperCase();
    }
    setFormData(prev => {
      const targetSection = prev[section] || {};
      const newData = { ...prev, [section]: { ...targetSection, [field]: finalValue } };
      
      if (section === 'datosPersonales') {
        if (field === 'fechaNacimiento') {
          newData.datosPersonales.edad = calcularEdad(finalValue);
        }
        // Si cambia la nacionalidad o la cédula, recalculamos el RIF automáticamente
        if (field === 'nacionalidad' || field === 'cedula') {
          const nac = field === 'nacionalidad' ? finalValue : newData.datosPersonales.nacionalidad;
          const ced = field === 'cedula' ? finalValue : newData.datosPersonales.cedula;
          newData.datosPersonales.rif = calcularRifAutomatico(nac, ced);
        }
      }
      return newData;
    });
    setValidationErrors([]); 
  };

  const handleNestedInputChange = (section, subSection, field, value) => {
    let finalValue = typeof value === 'string' ? value.toUpperCase() : value;
    setFormData(prev => {
      const targetSection = prev[section] || {};
      const subTarget = targetSection[subSection] || {};
      return {
        ...prev,
        [section]: {
          ...targetSection,
          [subSection]: {
            ...subTarget,
            [field]: finalValue
          }
        }
      };
    });
    setValidationErrors([]);
  };

  const handlePhoneChange = (section, field, value) => {
    const cleaned = value.replace(/\D/g, ''); 
    let formatted = cleaned;
    if (cleaned.length > 4) formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 11)}`;
    handleInputChange(section, field, formatted);
  };

  const handleArrayChange = (section, arrayName, index, field, value) => {
    let finalValue = typeof value === 'string' ? value.toUpperCase() : value;
    setFormData(prev => {
      const targetSection = prev[section] || {};
      const currentArray = Array.isArray(targetSection[arrayName]) ? targetSection[arrayName] : [];
      const newArray = [...currentArray];
      newArray[index] = { ...(newArray[index] || {}), [field]: finalValue };
      if (section === 'actividadesFamilia' && arrayName === 'dependientes' && field === 'fechaNacimiento') {
        newArray[index].edad = calcularEdad(finalValue);
      }
      return { ...prev, [section]: { ...targetSection, [arrayName]: newArray } };
    });
  };

  const addRow = (section, arrayName, emptyObject) => setFormData(prev => {
    const targetSection = prev[section] || {};
    const currentArray = Array.isArray(targetSection[arrayName]) ? targetSection[arrayName] : [];
    return { ...prev, [section]: { ...targetSection, [arrayName]: [...currentArray, emptyObject] } };
  });

  const removeRow = (section, arrayName, index) => setFormData(prev => {
    const targetSection = prev[section] || {};
    const currentArray = Array.isArray(targetSection[arrayName]) ? targetSection[arrayName] : [];
    const newArray = [...currentArray];
    newArray.splice(index, 1);
    return { ...prev, [section]: { ...targetSection, [arrayName]: newArray } };
  });

  const validateTab = (tabIndex, data = formData) => {
    const errors = [];
    const dp = data.datosPersonales || {};
    const dir = data.direccion || {};
    const ed = data.educacion || {};
    const fs = data.actividadesFamilia || {};
    const exp = data.experiencia || {};
    const hcm = data.hcmPolizas || {};

    if (tabIndex === 0) {
      if (!dp.rif) errors.push("RIF");
      if (!dp.nacionalidad) errors.push("Nacionalidad");
      if (!dp.lugarNacimiento) errors.push("Lugar de Nacimiento");
      if (!dp.fechaNacimiento) errors.push("Fecha de Nacimiento");
      if (!dp.sexo) errors.push("Sexo");
      if (!dp.estadoCivil) errors.push("Estado Civil");
      if (!dp.correo) errors.push("Correo Electrónico");
      if (!dp.tlfMovil || dp.tlfMovil.length < 12) errors.push("Teléfono Móvil (Formato 0XXX-XXXXXXX)");
      if (!dp.unidadAdscripcion) errors.push("Unidad de Adscripción");
      if (!dp.gerenciaGeneral) errors.push("Gerencia General");
      if (!dp.emergenciaNombre1) errors.push("Nombre Contacto Emergencia 1");
      if (!dp.emergenciaTelefono1 || dp.emergenciaTelefono1.length < 12) errors.push("Teléfono Emergencia 1 (Incompleto)");
      if (!dp.emergenciaNombre2) errors.push("Nombre Contacto Emergencia 2");
      if (!dp.emergenciaTelefono2 || dp.emergenciaTelefono2.length < 12) errors.push("Teléfono Emergencia 2 (Incompleto)");
      if (!dp.estatura) errors.push("Estatura");
      if (!dp.peso) errors.push("Peso");
    } else if (tabIndex === 1) {
      if (!dir.estado) errors.push("Estado");
      if (!dir.ciudad) errors.push("Ciudad");
      if (!dir.municipio) errors.push("Municipio");
      if (!dir.parroquia) errors.push("Parroquia");
      if (!dir.avenida) errors.push("Avenida, calle o cruce");
    } else if (tabIndex === 2) {
      if (!ed.estudiaActualmente) errors.push("¿Estudia Act?");
      if (!ed.traslado) errors.push("Traslado al trabajo");
    } else if (tabIndex === 3) {
      if (!fs.discapacidadPropia) errors.push("¿Posee discapacidad?");
      if (fs.discapacidadPropia === 'SÍ') {
        if (!fs.discapacidadDesc) errors.push("Especifique discapacidad propia");
        if (!fs.carnetConapdis) errors.push("N° de Carnet CONAPDIS propio");
      }
      if (!fs.tomaMedicamento) errors.push("¿Toma medicamento?");

      const dependientes = Array.isArray(fs.dependientes) ? fs.dependientes : [];
      dependientes.forEach((dep, idx) => {
        if ((dep.parentesco === 'HIJO CON DISCAPACIDAD' || dep.parentesco === 'HIJA CON DISCAPACIDAD') && !dep.discapacidad) {
          errors.push(`N° Carnet CONAPDIS requerido para el familiar #${idx + 1} (${dep.parentesco})`);
        }
      });
    } else if (tabIndex === 4) {
      if (!exp.esJubilado) errors.push("¿Es jubilado?");
      if (!exp.enProcesoJubilacion) errors.push("¿En proceso de jubilación?");
    } else if (tabIndex === 5) {
      if (hcm.familiarMovilnet === 'SÍ' && !hcm.familiarMovilnetParentesco) {
        errors.push("Indique el parentesco del familiar en Movilnet");
      }
      if (!hcm.lugarDeclaracion) errors.push("Lugar de declaración de salud");
      if (!hcm.fechaDeclaracion) errors.push("Fecha de declaración de salud");
    }
    return errors;
  };

  const handleNext = () => {
    const errors = validateTab(activeTab);
    if (errors.length > 0) return setValidationErrors(errors);
    setValidationErrors([]);
    const nextTab = activeTab + 1;
    setActiveTab(nextTab);
    if (nextTab > maxUnlockedTab) setMaxUnlockedTab(nextTab);
    window.scrollTo(0, 0);
  };

  const handlePrev = () => {
    setValidationErrors([]);
    setActiveTab(activeTab - 1);
    window.scrollTo(0, 0);
  };

  // ================= MANEJADORES DE ACCESO =================
  const handleLoginClave = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setIsSearching(true);
    try {
      const response = await fetch(`/api/login-clave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: loginCedula, clave: loginClave })
      });
      
      if (response.ok) {
        const data = await response.json();
        processSuccessfulLogin(data);
      } else {
        const errData = await response.json();
        setLoginError(errData.detail || 'Credenciales incorrectas.');
      }
    } catch (error) {
      setLoginError('Error de conexión con el servidor.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleVerifySap = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setIsSearching(true);
    try {
      const response = await fetch(`/api/verify-sap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          p00: p00Input,
          cedula: cedulaInput,
          fecha_nacimiento: fechaNacimientoInput
        })
      });
      
      if (response.ok) {
        setLoginStep('createPassword');
      } else {
        const errData = await response.json();
        setLoginError(errData.detail || 'Error de validación SAP.');
      }
    } catch (error) {
      setLoginError('Error de conexión con la base de datos.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreatePassword = async (e) => {
    e.preventDefault();
    setLoginError(null);
    
    if (newPassword.length < 4) {
      setLoginError('La clave debe tener al menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLoginError('Las claves no coinciden.');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          p00: p00Input,
          cedula: cedulaInput,
          clave: newPassword
        })
      });

      if (response.ok) {
        const loginResp = await fetch(`/api/login-clave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cedula: cedulaInput, clave: newPassword })
        });
        const data = await loginResp.json();
        processSuccessfulLogin(data);
      } else {
        const errData = await response.json();
        setLoginError(errData.detail || 'Error al guardar la clave.');
      }
    } catch (error) {
      setLoginError('Error de conexión.');
    } finally {
      setIsSearching(false);
    }
  };

  const processSuccessfulLogin = (data) => {
    if (data.datos_previos) {
      const rawData = data.datos_previos;
      if (!rawData.hcmPolizas) {
        rawData.hcmPolizas = {
          familiarMovilnet: 'NO',
          familiarMovilnetParentesco: '',
          tieneOtroSeguro: 'NO',
          segurosVigentes: [],
          beneficiariosFallecimiento: [],
          declaracionSalud: { p1: 'NO', p2: 'NO', p3: 'NO', p4: 'NO', p5: 'NO', p6: 'NO', p7: 'NO', p8: 'NO', p9: 'NO', p10: 'NO', p11: 'NO', p12: 'NO', p13: 'NO', p14: 'NO', p15: 'NO', detallesEnfermedades: '' },
          lugarDeclaracion: '',
          fechaDeclaracion: ''
        };
      }
      const formattedData = convertDataToUppercase(rawData);
      setFormData(prev => ({
        ...prev,
        ...formattedData,
        hcmPolizas: { ...prev.hcmPolizas, ...(formattedData.hcmPolizas || {}) }
      }));

      let unlocked = 0;
      for (let i = 0; i <= 5; i++) {
        if (validateTab(i, formattedData).length === 0) unlocked = i + 1;
        else break;
      }
      if (unlocked > 5) unlocked = 5;
      setMaxUnlockedTab(unlocked);
      setActiveTab(unlocked);
    } else {
      const ced = (data.cedula || '').toUpperCase();
      const nac = 'V';
      const rifAuto = calcularRifAutomatico(nac, ced);
      setFormData(prev => ({ 
        ...prev, 
        datosPersonales: { 
          ...prev.datosPersonales, 
          nombres: (data.nombres || '').toUpperCase(), 
          apellidos: (data.apellidos || '').toUpperCase(), 
          cedula: ced,
          nacionalidad: nac,
          rif: rifAuto
        } 
      }));
      setMaxUnlockedTab(0);
      setActiveTab(0);
    }
    setIsAuthenticated(true);
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true); setSubmitStatus(null); setValidationErrors([]);
    try {
      const response = await fetch('/api/oferta-servicio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (response.ok) { setSubmitStatus('draft'); window.scrollTo(0, 0); } else setSubmitStatus('error');
    } catch (error) { setSubmitStatus('error'); } finally { setIsSavingDraft(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateTab(5);
    if (errors.length > 0) return setValidationErrors(errors);
    setIsSubmitting(true); setSubmitStatus(null);
    try {
      const response = await fetch('/api/oferta-servicio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (response.ok) { setSubmitStatus('success'); window.scrollTo(0, 0); } else setSubmitStatus('error');
    } catch (error) { setSubmitStatus('error'); } finally { setIsSubmitting(false); }
  };

  const Req = () => <span className="text-red-500 ml-1" title="Campo obligatorio">*</span>;

  // Garantizar acceso seguro a propiedades anidadas en el render
  const safeData = formData || {};
  const dp = safeData.datosPersonales || {};
  const dir = safeData.direccion || {};
  const ed = safeData.educacion || {};
  const fs = safeData.actividadesFamilia || {};
  const exp = safeData.experiencia || {};
  const hcm = safeData.hcmPolizas || {};
  const declSalud = hcm.declaracionSalud || {};

  // ================= PANTALLAS DE ACCESO (RESPONSIVE) =================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-3 sm:p-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md overflow-hidden">
          <div className="bg-blue-900 text-white p-5 sm:p-6 text-center">
            <h1 className="text-xl sm:text-2xl font-bold">Movilnet C.A.</h1>
            <h2 className="text-xs sm:text-sm text-blue-200 mt-1">Gestión Humana - Fondo Administrado de Salud</h2>
          </div>

          <>
            {loginStep === 'login' && (
              <form onSubmit={handleLoginClave} className="p-6 sm:p-8">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 text-center">Iniciar Sesión</h3>
                
                <div className="mb-4">
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Cédula de Identidad</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CreditCard className="h-5 w-5 text-gray-400" /></div>
                    <input type="text" placeholder="Ej. 12345678" className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none uppercase font-medium text-sm" value={loginCedula} onChange={(e) => setLoginCedula(e.target.value.toUpperCase())} required />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Clave Personal</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Key className="h-5 w-5 text-gray-400" /></div>
                    <input type="password" placeholder="Tu clave de acceso" className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-medium text-sm" value={loginClave} onChange={(e) => setLoginClave(e.target.value)} required />
                  </div>
                </div>

                {loginError && <div className="mb-6 p-3 bg-red-50 text-red-700 text-xs sm:text-sm border-l-4 border-red-500 rounded font-medium">{loginError}</div>}
                
                <button type="submit" disabled={isSearching || !loginCedula || !loginClave} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center disabled:opacity-50 transition-colors mb-4 text-sm">
                  {isSearching ? 'Ingresando...' : <><Search size={18} className="mr-2" /> Ingresar</>}
                </button>

                <div className="text-center mt-4 border-t pt-4">
                  <button type="button" onClick={() => { setLoginStep('verifyFirst'); setLoginError(null); }} className="text-xs sm:text-sm text-blue-600 hover:underline font-medium">
                    ¿Es tu primer ingreso? Regístrate aquí
                  </button>
                </div>
              </form>
            )}

            {loginStep === 'verifyFirst' && (
              <form onSubmit={handleVerifySap} className="p-6 sm:p-8">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2 text-center">Primer Ingreso - Validación SAP</h3>
                <p className="text-xs text-gray-500 mb-6 text-center">Ingrese sus datos de empleado para autenticar su identidad.</p>
                
                <div className="mb-4">
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Número de Personal (P00)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserCheck className="h-5 w-5 text-gray-400" /></div>
                    <input type="text" placeholder="Ej. P0012345" className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none uppercase font-medium text-sm" value={p00Input} onChange={(e) => setP00Input(e.target.value.toUpperCase())} required />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Cédula de Identidad</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CreditCard className="h-5 w-5 text-gray-400" /></div>
                    <input type="text" placeholder="Cédula registrada en SAP" className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none uppercase font-medium text-sm" value={cedulaInput} onChange={(e) => setCedulaInput(e.target.value.toUpperCase())} required />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Fecha de Nacimiento</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="h-5 w-5 text-gray-400" /></div>
                    <input type="date" className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-medium text-gray-700 text-sm" value={fechaNacimientoInput} onChange={(e) => setFechaNacimientoInput(e.target.value)} required />
                  </div>
                </div>

                {loginError && <div className="mb-6 p-3 bg-red-50 text-red-700 text-xs sm:text-sm border-l-4 border-red-500 rounded font-medium">{loginError}</div>}
                
                <button type="submit" disabled={isSearching || !p00Input || !cedulaInput || !fechaNacimientoInput} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center disabled:opacity-50 transition-colors mb-4 text-sm">
                  {isSearching ? 'Verificando...' : 'Verificar y Continuar'}
                </button>

                <div className="text-center mt-2">
                  <button type="button" onClick={() => { setLoginStep('login'); setLoginError(null); }} className="text-xs sm:text-sm text-gray-600 hover:underline">
                    ← Volver al inicio de sesión
                  </button>
                </div>
              </form>
            )}

            {loginStep === 'createPassword' && (
              <form onSubmit={handleCreatePassword} className="p-6 sm:p-8">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2 text-center">Crea tu Clave Personal</h3>
                <p className="text-xs text-gray-500 mb-6 text-center">Esta clave te servirá para ingresar en tus próximas visitas sin necesidad de validar tus datos de SAP.</p>
                
                <div className="mb-4">
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Nueva Clave</label>
                  <input type="password" placeholder="Mínimo 4 caracteres" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-medium text-sm" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>

                <div className="mb-6">
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Confirmar Clave</label>
                  <input type="password" placeholder="Repite tu clave" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-medium text-sm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>

                {loginError && <div className="mb-6 p-3 bg-red-50 text-red-700 text-xs sm:text-sm border-l-4 border-red-500 rounded font-medium">{loginError}</div>}
                
                <button type="submit" disabled={isSearching || !newPassword || !confirmPassword} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center disabled:opacity-50 transition-colors text-sm">
                  {isSearching ? 'Guardando...' : 'Guardar Clave y Entrar'}
                </button>
              </form>
            )}
          </>

        </div>
      </div>
    );
  }

  // ================= PANTALLA PRINCIPAL (FORMULARIO ADAPTABLE) =================
  return (
    <div className="min-h-screen bg-gray-100 text-left pb-12 font-sans">
      <header className="bg-blue-900 text-white p-4 sm:p-5 shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-center sm:text-left">Telecomunicaciones Movilnet C.A.</h1>
            <h2 className="text-xs sm:text-sm text-blue-200 mt-0.5 text-center sm:text-left">Fondo Administrado de Salud - Actualización de Datos</h2>
          </div>
          <div className="bg-blue-800 p-2.5 sm:p-3 rounded-lg border border-blue-700 w-full sm:w-auto min-w-[240px] relative">
             <button onClick={() => {setIsAuthenticated(false); setLoginStep('login'); setSubmitStatus(null); setLoginCedula(''); setLoginClave('');}} className="absolute top-2 right-2 text-blue-300 hover:text-white text-xs underline">Salir</button>
            <p className="text-xs sm:text-sm font-semibold uppercase pr-10">{dp.nombres} {dp.apellidos}</p>
            <p className="text-xs text-blue-300">C.I: {dp.cedula}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-4 sm:mt-6 px-2 sm:px-4">
        <>
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded flex items-start shadow-sm">
              <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div><h3 className="text-green-800 font-bold text-sm sm:text-base">¡Datos guardados exitosamente!</h3><p className="text-green-700 text-xs sm:text-sm mt-1">La información ha sido completada y registrada de forma definitiva.</p></div>
            </div>
          )}
          {submitStatus === 'draft' && (
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded flex items-start shadow-sm">
              <Save className="text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
              <div><h3 className="text-blue-800 font-bold text-sm sm:text-base">¡Borrador guardado exitosamente!</h3><p className="text-blue-700 text-xs sm:text-sm mt-1">Puede salir del sistema. Cuando vuelva a ingresar con su cédula y clave, continuará exactamente donde lo dejó.</p></div>
            </div>
          )}
        </>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          
          <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50 scrollbar-thin">
            {tabs.map((tab, idx) => (
              <button key={idx} type="button" onClick={() => { if(idx <= maxUnlockedTab) setActiveTab(idx); }} disabled={idx > maxUnlockedTab}
                className={`px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors flex-1 text-center flex items-center justify-center gap-1.5
                  ${activeTab === idx ? 'border-b-4 border-blue-600 text-blue-800 bg-white' : ''}
                  ${idx > maxUnlockedTab ? 'text-gray-400 cursor-not-allowed opacity-60 bg-gray-100' : 'text-gray-600 hover:bg-gray-100'}
                  ${idx <= maxUnlockedTab && activeTab !== idx ? 'text-gray-700 hover:text-blue-600' : ''}
                `}
              >
                <span>{tab}</span> {idx > maxUnlockedTab && <Lock size={13} className="text-gray-400 flex-shrink-0" />}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8">
            
            {/* ================= PESTAÑA 1 ================= */}
            <div className={activeTab === 0 ? 'block' : 'hidden'}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 mb-6 sm:mb-8 bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-100">
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Cédula de Identidad</label><input type="text" value={dp.cedula || ''} disabled className="w-full p-2 border rounded bg-gray-200 text-gray-700 text-xs sm:text-sm" /></div>
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Nombres</label><input type="text" value={dp.nombres || ''} disabled className="w-full p-2 border rounded bg-gray-200 text-gray-700 text-xs sm:text-sm" /></div>
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Apellidos</label><input type="text" value={dp.apellidos || ''} disabled className="w-full p-2 border rounded bg-gray-200 text-gray-700 text-xs sm:text-sm" /></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">RIF (Calculado Automáticamente) <Req/></label>
                  <input type="text" className="w-full p-2 border rounded bg-gray-100 text-gray-800 font-bold text-xs sm:text-sm" value={dp.rif || ''} readOnly title="Calculado automáticamente por módulo 11" />
                </div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Nacionalidad <Req/></label><select className="w-full p-2 border rounded bg-white text-xs sm:text-sm" value={dp.nacionalidad || ''} onChange={e => handleInputChange('datosPersonales', 'nacionalidad', e.target.value)}><option value="">SELECCIONE</option><option value="V">V</option><option value="E">E</option></select></div>
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Si es naturalizado indique Gaceta</label><input type="text" className="w-full p-2 border rounded text-xs sm:text-sm" value={dp.gaceta || ''} onChange={e => handleInputChange('datosPersonales', 'gaceta', e.target.value)} /></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Lugar de Nacimiento <Req/></label><input type="text" className="w-full p-2 border rounded text-xs sm:text-sm" value={dp.lugarNacimiento || ''} onChange={e => handleInputChange('datosPersonales', 'lugarNacimiento', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Fecha de Nacimiento <Req/></label><input type="date" className="w-full p-2 border rounded text-xs sm:text-sm" value={dp.fechaNacimiento || ''} onChange={e => handleInputChange('datosPersonales', 'fechaNacimiento', e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Edad <Req/></label><input type="number" readOnly placeholder="Autocalc." className="w-full p-2 border rounded bg-gray-100 text-gray-600 text-xs sm:text-sm" value={dp.edad || ''} /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Sexo <Req/></label><select className="w-full p-2 border rounded bg-white text-xs sm:text-sm" value={dp.sexo || ''} onChange={e => handleInputChange('datosPersonales', 'sexo', e.target.value)}><option value="">SEL</option><option value="M">M</option><option value="F">F</option></select></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 border-t pt-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Grupo Sanguíneo</label>
                  <select className="w-full p-2 border rounded bg-white text-xs sm:text-sm" value={dp.grupoSanguineo || ''} onChange={e => handleInputChange('datosPersonales', 'grupoSanguineo', e.target.value)}>
                    <option value="">SELECCIONE</option><option value="O+">O+</option><option value="O-">O-</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option>
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Estado Civil <Req/></label><select className="w-full p-2 border rounded bg-white text-xs sm:text-sm" value={dp.estadoCivil || ''} onChange={e => handleInputChange('datosPersonales', 'estadoCivil', e.target.value)}><option value="">SELECCIONE</option><option value="SOLTERO">SOLTERO</option><option value="CASADO">CASADO</option><option value="VIUDO">VIUDO</option><option value="DIVORCIADO">DIVORCIADO</option><option value="CONCUBINO">CONCUBINO</option></select></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Habilidad Motriz</label><select className="w-full p-2 border rounded bg-white text-xs sm:text-sm" value={dp.habilidadMotriz || ''} onChange={e => handleInputChange('datosPersonales', 'habilidadMotriz', e.target.value)}><option value="">SELECCIONE</option><option value="DIESTRO">DIESTRO</option><option value="ZURDO">ZURDO</option><option value="AMBIDIESTRO">AMBIDIESTRO</option></select></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Licencia de Conducir / Grado</label><div className="flex gap-2"><input type="text" placeholder="Nro" className="w-2/3 p-2 border rounded text-xs sm:text-sm" value={dp.licencia || ''} onChange={e => handleInputChange('datosPersonales', 'licencia', e.target.value)} /><input type="text" placeholder="Grado" className="w-1/3 p-2 border rounded text-xs sm:text-sm" value={dp.gradoLicencia || ''} onChange={e => handleInputChange('datosPersonales', 'gradoLicencia', e.target.value)} /></div></div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-6">
                <h4 className="text-xs font-bold text-blue-900 mb-3 uppercase">Adscripción y Ubicación Corporativa (FAS Movilnet)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Unidad de Adscripción <Req/></label><select className="w-full p-2 border rounded bg-white text-xs sm:text-sm" value={dp.unidadAdscripcion || ''} onChange={e => handleInputChange('datosPersonales', 'unidadAdscripcion', e.target.value)}><option value="">SELECCIONE</option><option value="PRESIDENCIA">PRESIDENCIA</option><option value="VICEPRESIDENCIA">VICEPRESIDENCIA</option></select></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Gerencia General <Req/></label><input type="text" placeholder="Ej. GG GESTION HUMANA" className="w-full p-2 border rounded text-xs sm:text-sm" value={dp.gerenciaGeneral || ''} onChange={e => handleInputChange('datosPersonales', 'gerenciaGeneral', e.target.value)} /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Región</label><input type="text" placeholder="Ej. CAPITAL" className="w-full p-2 border rounded text-xs sm:text-sm" value={dp.region || ''} onChange={e => handleInputChange('datosPersonales', 'region', e.target.value)} /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Estado de Trabajo</label><input type="text" placeholder="Ej. DISTRITO CAPITAL" className="w-full p-2 border rounded text-xs sm:text-sm" value={dp.estadoTrabajo || ''} onChange={e => handleInputChange('datosPersonales', 'estadoTrabajo', e.target.value)} /></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 border-t pt-4">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Vivienda</label><select className="w-full p-2 border rounded bg-white text-xs sm:text-sm" value={dp.tipoVivienda || ''} onChange={e => handleInputChange('datosPersonales', 'tipoVivienda', e.target.value)}><option value="">SELECCIONE</option><option value="CASA">CASA</option><option value="APARTAMENTO">APARTAMENTO</option><option value="QUINTA">QUINTA</option><option value="OTRO">OTRO</option></select></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Condición Vivienda</label><select className="w-full p-2 border rounded bg-white text-xs sm:text-sm" value={dp.condicionVivienda || ''} onChange={e => handleInputChange('datosPersonales', 'condicionVivienda', e.target.value)}><option value="">SELECCIONE</option><option value="PROPIA">PROPIA</option><option value="ALQUILADA">ALQUILADA</option><option value="FAMILIAR">FAMILIAR</option><option value="OTRA">OTRA</option></select></div>
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">¿Es Ud. Alérgico? / Indique</label><div className="flex gap-2"><select className="w-1/3 p-2 border rounded bg-white text-xs sm:text-sm" value={dp.alergico || ''} onChange={e => handleInputChange('datosPersonales', 'alergico', e.target.value)}><option value="">NO / SÍ</option><option value="SÍ">SÍ</option><option value="NO">NO</option></select><input type="text" placeholder="Especifique si aplica" className="w-2/3 p-2 border rounded text-xs sm:text-sm" value={dp.alergiaDesc || ''} onChange={e => handleInputChange('datosPersonales', 'alergiaDesc', e.target.value)} /></div></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 border-t pt-4">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Profesión u Oficio</label><input type="text" className="w-full p-2 border rounded text-xs sm:text-sm" value={dp.profesion || ''} onChange={e => handleInputChange('datosPersonales', 'profesion', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Ocupación Específica</label><input type="text" className="w-full p-2 border rounded text-xs sm:text-sm" value={dp.ocupacion || ''} onChange={e => handleInputChange('datosPersonales', 'ocupacion', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">¿Está Ud. Colegiado? / Nro</label><div className="flex gap-2"><select className="w-1/3 p-2 border rounded bg-white text-xs sm:text-sm" value={dp.colegiado || ''} onChange={e => handleInputChange('datosPersonales', 'colegiado', e.target.value)}><option value="">NO / SÍ</option><option value="SÍ">SÍ</option><option value="NO">NO</option></select><input type="text" placeholder="Nro" className="w-2/3 p-2 border rounded text-xs sm:text-sm" value={dp.nroColegiado || ''} onChange={e => handleInputChange('datosPersonales', 'nroColegiado', e.target.value)} /></div></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 border-t pt-4">
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Correo Electrónico Personal <Req/></label><input type="email" className="w-full p-2 border rounded lowercase text-xs sm:text-sm" value={dp.correo || ''} onChange={e => handleInputChange('datosPersonales', 'correo', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Teléfono Móvil <Req/></label><input type="text" placeholder="Ej. 0414-1234567" maxLength="12" className="w-full p-2 border rounded text-xs sm:text-sm" value={dp.tlfMovil || ''} onChange={e => handlePhoneChange('datosPersonales', 'tlfMovil', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Teléfono Local</label><input type="text" placeholder="Ej. 0212-1234567" maxLength="12" className="w-full p-2 border rounded text-xs sm:text-sm" value={dp.tlfLocal || ''} onChange={e => handlePhoneChange('datosPersonales', 'tlfLocal', e.target.value)} /></div>
              </div>

              <div className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-100 mt-6 mb-6">
                <h4 className="text-xs sm:text-sm font-bold text-red-800 mb-3 uppercase">En caso de emergencia comunicarse con</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Contacto 1 (Nombre y Apellido) <Req/></label><input type="text" className="w-full p-2 border border-red-300 rounded text-xs sm:text-sm" value={dp.emergenciaNombre1 || ''} onChange={e => handleInputChange('datosPersonales', 'emergenciaNombre1', e.target.value)} /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Teléfono Contacto 1 <Req/></label><input type="text" placeholder="Ej. 0414-1234567" maxLength="12" className="w-full p-2 border border-red-300 rounded text-xs sm:text-sm" value={dp.emergenciaTelefono1 || ''} onChange={e => handlePhoneChange('datosPersonales', 'emergenciaTelefono1', e.target.value)} /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Contacto 2 (Nombre y Apellido) <Req/></label><input type="text" className="w-full p-2 border border-red-300 rounded text-xs sm:text-sm" value={dp.emergenciaNombre2 || ''} onChange={e => handleInputChange('datosPersonales', 'emergenciaNombre2', e.target.value)} /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Teléfono Contacto 2 <Req/></label><input type="text" placeholder="Ej. 0212-1234567" maxLength="12" className="w-full p-2 border border-red-300 rounded text-xs sm:text-sm" value={dp.emergenciaTelefono2 || ''} onChange={e => handlePhoneChange('datosPersonales', 'emergenciaTelefono2', e.target.value)} /></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">¿Posee Carnet de la Patria? / Nro</label><div className="flex gap-2"><select className="w-1/3 p-2 border rounded bg-white text-xs sm:text-sm" value={dp.carnetPatria || ''} onChange={e => handleInputChange('datosPersonales', 'carnetPatria', e.target.value)}><option value="">NO / SÍ</option><option value="SÍ">SÍ</option><option value="NO">NO</option></select><input type="text" placeholder="Nro Carnet" className="w-2/3 p-2 border rounded text-xs sm:text-sm" value={dp.nroCarnetPatria || ''} onChange={e => handleInputChange('datosPersonales', 'nroCarnetPatria', e.target.value)} /></div></div>
              </div>

              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border mt-6">
                <h4 className="text-xs sm:text-sm font-bold text-gray-700 mb-3 uppercase">Tallas y Medidas</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                  <div><label className="block text-xs text-gray-600 mb-1">Estatura <Req/></label><input type="text" placeholder="Ej. 1.75m" className="w-full p-2 border rounded text-xs sm:text-sm" value={dp.estatura || ''} onChange={e => handleInputChange('datosPersonales', 'estatura', e.target.value)} /></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Peso <Req/></label><input type="text" placeholder="Ej. 75kg" className="w-full p-2 border rounded text-xs sm:text-sm" value={dp.peso || ''} onChange={e => handleInputChange('datosPersonales', 'peso', e.target.value)} /></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Camisa</label><select className="w-full p-2 border rounded text-xs sm:text-sm bg-white" value={dp.tallaCamisa || ''} onChange={e => handleInputChange('datosPersonales', 'tallaCamisa', e.target.value)}><option value="">SEL...</option><option value="SS">SS</option><option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option><option value="XXXL">XXXL</option></select></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Chemise</label><select className="w-full p-2 border rounded text-xs sm:text-sm bg-white" value={dp.tallaChemise || ''} onChange={e => handleInputChange('datosPersonales', 'tallaChemise', e.target.value)}><option value="">SEL...</option><option value="SS">SS</option><option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option><option value="XXXL">XXXL</option></select></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Franela</label><select className="w-full p-2 border rounded text-xs sm:text-sm bg-white" value={dp.tallaFranela || ''} onChange={e => handleInputChange('datosPersonales', 'tallaFranela', e.target.value)}><option value="">SEL...</option><option value="SS">SS</option><option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option><option value="XXXL">XXXL</option></select></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Bluejean</label><input type="text" placeholder="Ej. 32" className="w-full p-2 border rounded text-xs sm:text-sm" value={dp.tallaBluejean || ''} onChange={e => handleInputChange('datosPersonales', 'tallaBluejean', e.target.value)} /></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Bota Seg.</label><input type="text" placeholder="Ej. 42" className="w-full p-2 border rounded text-xs sm:text-sm" value={dp.tallaBota || ''} onChange={e => handleInputChange('datosPersonales', 'tallaBota', e.target.value)} /></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Zapatos</label><input type="text" placeholder="Ej. 42" className="w-full p-2 border rounded text-xs sm:text-sm" value={dp.tallaZapato || ''} onChange={e => handleInputChange('datosPersonales', 'tallaZapato', e.target.value)} /></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Casco</label><input type="text" placeholder="Ej. L o 58cm" className="w-full p-2 border rounded text-xs sm:text-sm" value={dp.tallaCasco || ''} onChange={e => handleInputChange('datosPersonales', 'tallaCasco', e.target.value)} /></div>
                </div>
              </div>
            </div>

            {/* ================= PESTAÑA 2 ================= */}
            <div className={activeTab === 1 ? 'block' : 'hidden'}>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 border-b pb-2">Dirección de Habitación</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 mb-6">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Estado <Req/></label><input type="text" className="w-full p-2 border rounded text-xs sm:text-sm" value={dir.estado || ''} onChange={e => handleInputChange('direccion', 'estado', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Ciudad <Req/></label><input type="text" className="w-full p-2 border rounded text-xs sm:text-sm" value={dir.ciudad || ''} onChange={e => handleInputChange('direccion', 'ciudad', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Municipio <Req/></label><input type="text" className="w-full p-2 border rounded text-xs sm:text-sm" value={dir.municipio || ''} onChange={e => handleInputChange('direccion', 'municipio', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Parroquia <Req/></label><input type="text" className="w-full p-2 border rounded text-xs sm:text-sm" value={dir.parroquia || ''} onChange={e => handleInputChange('direccion', 'parroquia', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Urbanización</label><input type="text" className="w-full p-2 border rounded text-xs sm:text-sm" value={dir.urbanizacion || ''} onChange={e => handleInputChange('direccion', 'urbanizacion', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Sector</label><input type="text" className="w-full p-2 border rounded text-xs sm:text-sm" value={dir.sector || ''} onChange={e => handleInputChange('direccion', 'sector', e.target.value)} /></div>
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Avenida, calle o cruce <Req/></label><input type="text" className="w-full p-2 border rounded text-xs sm:text-sm" value={dir.avenida || ''} onChange={e => handleInputChange('direccion', 'avenida', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Código Postal</label><input type="text" className="w-full p-2 border rounded text-xs sm:text-sm" value={dir.codigoPostal || ''} onChange={e => handleInputChange('direccion', 'codigoPostal', e.target.value)} /></div>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 border rounded-lg">
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Identificación del Inmueble</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div><input type="text" placeholder="Edf./Res./Casa" className="w-full p-2 border rounded text-xs sm:text-sm" value={dir.inmueble || ''} onChange={e => handleInputChange('direccion', 'inmueble', e.target.value)} /></div>
                  <div><input type="text" placeholder="Piso o Nivel" className="w-full p-2 border rounded text-xs sm:text-sm" value={dir.piso || ''} onChange={e => handleInputChange('direccion', 'piso', e.target.value)} /></div>
                  <div><input type="text" placeholder="Apto. o N°" className="w-full p-2 border rounded text-xs sm:text-sm" value={dir.apto || ''} onChange={e => handleInputChange('direccion', 'apto', e.target.value)} /></div>
                </div>
              </div>
            </div>

            {/* ================= PESTAÑA 3 ================= */}
            <div className={activeTab === 2 ? 'block' : 'hidden'}>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 border-b pb-2">Educación Formal</h3>
              <div className="overflow-x-auto mb-8 border rounded-lg">
                <table className="w-full text-xs sm:text-sm text-left bg-white min-w-[500px]">
                  <thead className="text-xs text-gray-700 bg-gray-100 border-b">
                    <tr><th className="p-3 w-1/4">Nivel</th><th className="p-3 w-1/4">Graduado</th><th className="p-3">Título Obtenido</th></tr>
                  </thead>
                  <tbody>
                    {(ed.niveles || []).map((nivel, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-semibold text-gray-700">{nivel.nivel}</td>
                        <td className="p-3"><select className="w-full p-2 border rounded bg-white text-xs" value={nivel.graduado || ''} onChange={e => handleArrayChange('educacion', 'niveles', idx, 'graduado', e.target.value)}><option value="">SEL...</option><option value="SÍ">SÍ</option><option value="NO">NO</option></select></td>
                        <td className="p-3"><input type="text" className="w-full p-2 border rounded text-xs" value={nivel.titulo || ''} onChange={e => handleArrayChange('educacion', 'niveles', idx, 'titulo', e.target.value)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 mb-8 bg-blue-50 p-4 border border-blue-100 rounded-lg">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">¿Estudia Act? <Req/></label><select className="w-full p-2 border rounded bg-white text-xs sm:text-sm" value={ed.estudiaActualmente || ''} onChange={e => handleInputChange('educacion', 'estudiaActualmente', e.target.value)}><option value="">NO / SÍ</option><option value="SÍ">SÍ</option><option value="NO">NO</option></select></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Horario</label><input type="text" className="w-full p-2 border rounded text-xs sm:text-sm" value={ed.horario || ''} onChange={e => handleInputChange('educacion', 'horario', e.target.value)} /></div>
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Institución</label><input type="text" className="w-full p-2 border rounded text-xs sm:text-sm" value={ed.institucion || ''} onChange={e => handleInputChange('educacion', 'institucion', e.target.value)} /></div>
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Carrera</label><input type="text" className="w-full p-2 border rounded text-xs sm:text-sm" value={ed.carrera || ''} onChange={e => handleInputChange('educacion', 'carrera', e.target.value)} /></div>
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Nivel Alcanzado</label><input type="text" className="w-full p-2 border rounded text-xs sm:text-sm" value={ed.nivelAlcanzado || ''} onChange={e => handleInputChange('educacion', 'nivelAlcanzado', e.target.value)} /></div>
                <div className="sm:col-span-4"><label className="block text-xs font-medium text-gray-700 mb-1">¿Cómo se traslada desde casa a universidad/trabajo? <Req/></label><input type="text" className="w-full p-2 border rounded text-xs sm:text-sm" value={ed.traslado || ''} onChange={e => handleInputChange('educacion', 'traslado', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-1">Idiomas</h4>
                  {(safeData.programasIdiomas?.idiomas || []).map((idioma, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input type="text" placeholder={`${idx+1}) Indique Idioma`} className="w-1/2 p-2 border rounded text-xs" value={idioma.idioma || ''} onChange={e => handleArrayChange('programasIdiomas', 'idiomas', idx, 'idioma', e.target.value)} />
                      <select className="w-1/4 p-2 border rounded bg-white text-xs" value={idioma.nivelHablado || ''} onChange={e => handleArrayChange('programasIdiomas', 'idiomas', idx, 'nivelHablado', e.target.value)}><option value="">HABLADO</option><option value="BÁSICO">BÁSICO</option><option value="MEDIO">MEDIO</option><option value="AVANZADO">AVANZADO</option></select>
                      <select className="w-1/4 p-2 border rounded bg-white text-xs" value={idioma.nivelEscrito || ''} onChange={e => handleArrayChange('programasIdiomas', 'idiomas', idx, 'nivelEscrito', e.target.value)}><option value="">ESCRITO</option><option value="BÁSICO">BÁSICO</option><option value="MEDIO">MEDIO</option><option value="AVANZADO">AVANZADO</option></select>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-1">Programas Informáticos</h4>
                  {(safeData.programasIdiomas?.programas || []).map((prog, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input type="text" placeholder={`${idx+1}) Señale el Programa`} className="w-2/3 p-2 border rounded text-xs" value={prog.programa || ''} onChange={e => handleArrayChange('programasIdiomas', 'programas', idx, 'programa', e.target.value)} />
                      <select className="w-1/3 p-2 border rounded bg-white text-xs" value={prog.nivelDominio || ''} onChange={e => handleArrayChange('programasIdiomas', 'programas', idx, 'nivelDominio', e.target.value)}><option value="">NIVEL</option><option value="BÁSICO">BÁSICO</option><option value="MEDIO">MEDIO</option><option value="AVANZADO">AVANZADO</option></select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ================= PESTAÑA 4 ================= */}
            <div className={activeTab === 3 ? 'block' : 'hidden'}>
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-800">Carga Familiar</h3>
                <button type="button" onClick={() => addRow('actividadesFamilia', 'dependientes', { nombres: '', cedula: '', fechaNacimiento: '', edad: '', parentesco: '', discapacidad: '' })} className="text-xs bg-blue-100 text-blue-800 px-3 py-1.5 rounded hover:bg-blue-200 flex items-center font-bold">
                  <Plus size={16} className="mr-1"/> Añadir Familiar
                </button>
              </div>
              <div className="overflow-x-auto mb-8 border rounded-lg">
                <table className="w-full text-xs text-left bg-white min-w-[700px]">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="p-2 w-1/4">Apellidos y Nombres</th>
                      <th className="p-2">Cédula</th>
                      <th className="p-2">F. Nacimiento</th>
                      <th className="p-2 w-16">Edad</th>
                      <th className="p-2 w-40">Parentesco <Req/></th>
                      <th className="p-2">N° Carnet CONAPDIS</th>
                      <th className="p-2 w-10 text-center">X</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(fs.dependientes || []).map((dep, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-1"><input type="text" className="w-full p-1.5 border rounded text-xs" value={dep.nombres || ''} onChange={e => handleArrayChange('actividadesFamilia', 'dependientes', idx, 'nombres', e.target.value)} /></td>
                        <td className="p-1"><input type="text" className="w-full p-1.5 border rounded text-xs" value={dep.cedula || ''} onChange={e => handleArrayChange('actividadesFamilia', 'dependientes', idx, 'cedula', e.target.value)} /></td>
                        <td className="p-1"><input type="date" className="w-full p-1.5 border rounded text-xs" value={dep.fechaNacimiento || ''} onChange={e => handleArrayChange('actividadesFamilia', 'dependientes', idx, 'fechaNacimiento', e.target.value)} /></td>
                        <td className="p-1"><input type="number" readOnly placeholder="Auto." className="w-full p-1.5 border rounded bg-gray-100 text-gray-600 text-xs" value={dep.edad || ''} /></td>
                        <td className="p-1">
                          <select className="w-full p-1.5 border rounded bg-white text-xs uppercase" value={dep.parentesco || ''} onChange={e => handleArrayChange('actividadesFamilia', 'dependientes', idx, 'parentesco', e.target.value)}>
                            <option value="">SELECCIONE</option>
                            <option value="CÓNYUGE">CÓNYUGE</option>
                            <option value="PADRE">PADRE</option>
                            <option value="MADRE">MADRE</option>
                            <option value="HIJO">HIJO</option>
                            <option value="HIJA">HIJA</option>
                            <option value="HIJO CON DISCAPACIDAD">HIJO CON DISCAPACIDAD</option>
                            <option value="HIJA CON DISCAPACIDAD">HIJA CON DISCAPACIDAD</option>
                          </select>
                        </td>
                        <td className="p-1">
                          <input 
                            type="text" 
                            placeholder={(dep.parentesco === 'HIJO CON DISCAPACIDAD' || dep.parentesco === 'HIJA CON DISCAPACIDAD') ? 'OBLIGATORIO CONAPDIS' : 'Opcional'} 
                            className={`w-full p-1.5 border rounded text-xs ${(dep.parentesco === 'HIJO CON DISCAPACIDAD' || dep.parentesco === 'HIJA CON DISCAPACIDAD') && !dep.discapacidad ? 'border-red-500 bg-red-50' : ''}`} 
                            value={dep.discapacidad || ''} 
                            onChange={e => handleArrayChange('actividadesFamilia', 'dependientes', idx, 'discapacidad', e.target.value)} 
                          />
                        </td>
                        <td className="p-1 text-center"><button type="button" onClick={() => removeRow('actividadesFamilia', 'dependientes', idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-1">Salud del Trabajador</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    ¿Posee discapacidad? <Req/> {fs.discapacidadPropia === 'SÍ' && <Req/>} / Especifique
                  </label>
                  <div className="flex gap-2">
                    <select className="w-1/3 sm:w-1/4 p-2 border rounded bg-white text-xs" value={fs.discapacidadPropia || ''} onChange={e => handleInputChange('actividadesFamilia', 'discapacidadPropia', e.target.value)}>
                      <option value="">NO/SÍ</option>
                      <option value="SÍ">SÍ</option>
                      <option value="NO">NO</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder={fs.discapacidadPropia === 'SÍ' ? 'Obligatorio' : 'Especifique'} 
                      className={`w-2/3 sm:w-3/4 p-2 border rounded text-xs ${fs.discapacidadPropia === 'SÍ' && !fs.discapacidadDesc ? 'border-red-500 bg-red-50' : ''}`} 
                      value={fs.discapacidadDesc || ''} 
                      onChange={e => handleInputChange('actividadesFamilia', 'discapacidadDesc', e.target.value)} 
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Indique el N° de Carnet CONAPDIS {fs.discapacidadPropia === 'SÍ' && <Req/>}
                  </label>
                  <input 
                    type="text" 
                    placeholder={fs.discapacidadPropia === 'SÍ' ? 'Obligatorio CONAPDIS' : 'N° CONAPDIS'} 
                    className={`w-full p-2 border rounded text-xs sm:text-sm ${fs.discapacidadPropia === 'SÍ' && !fs.carnetConapdis ? 'border-red-500 bg-red-50' : ''}`} 
                    value={fs.carnetConapdis || ''} 
                    onChange={e => handleInputChange('actividadesFamilia', 'carnetConapdis', e.target.value)} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">¿Toma medicamento? <Req/> / Cuál y Frec.</label><div className="flex gap-2"><select className="w-1/3 sm:w-1/4 p-2 border rounded bg-white text-xs" value={fs.tomaMedicamento || ''} onChange={e => handleInputChange('actividadesFamilia', 'tomaMedicamento', e.target.value)}><option value="">NO/SÍ</option><option value="SÍ">SÍ</option><option value="NO">NO</option></select><input type="text" placeholder="Cuál y frecuencia" className="w-2/3 sm:w-3/4 p-2 border rounded text-xs" value={fs.medicamentoCual || ''} onChange={e => handleInputChange('actividadesFamilia', 'medicamentoCual', e.target.value)} /></div></div>
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Indique desde cuándo y su motivo</label><input type="text" className="w-full p-2 border rounded text-xs sm:text-sm" value={fs.medicamentoMotivo || ''} onChange={e => handleInputChange('actividadesFamilia', 'medicamentoMotivo', e.target.value)} /></div>
              </div>
            </div>

            {/* ================= PESTAÑA 5 ================= */}
            <div className={activeTab === 4 ? 'block' : 'hidden'}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-800 uppercase">Exp. Laboral Admin Pública</h3>
                <button type="button" onClick={() => addRow('experiencia', 'adminPublica', { organismo: '', direccion: '', telefono: '', cargo: '', ingreso: '', egreso: '', motivo: '' })} className="text-xs bg-gray-200 px-3 py-1.5 rounded hover:bg-gray-300 flex items-center font-bold"><Plus size={14} className="mr-1"/> Añadir</button>
              </div>
              <p className="text-xs text-gray-500 mb-3 border-b pb-2">Comenzando por el último o actual</p>
              {(exp.adminPublica || []).map((ex, idx) => (
                <div key={idx} className="bg-gray-50 p-3 sm:p-4 border rounded-lg mb-4 relative">
                  <button type="button" onClick={() => removeRow('experiencia', 'adminPublica', idx)} className="absolute top-2 right-2 text-red-500 hover:bg-red-100 p-1.5 rounded"><Trash2 size={16} /></button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                    <div className="sm:col-span-2"><label className="block text-xs text-gray-600 mb-1">Organismo</label><input type="text" className="w-full p-2 border rounded text-xs" value={ex.organismo || ''} onChange={e => handleArrayChange('experiencia', 'adminPublica', idx, 'organismo', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">Dirección</label><input type="text" className="w-full p-2 border rounded text-xs" value={ex.direccion || ''} onChange={e => handleArrayChange('experiencia', 'adminPublica', idx, 'direccion', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">Teléfono(s)</label><input type="text" className="w-full p-2 border rounded text-xs" value={ex.telefono || ''} onChange={e => handleArrayChange('experiencia', 'adminPublica', idx, 'telefono', e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div><label className="block text-xs text-gray-600 mb-1">Último cargo</label><input type="text" className="w-full p-2 border rounded text-xs" value={ex.cargo || ''} onChange={e => handleArrayChange('experiencia', 'adminPublica', idx, 'cargo', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">F. Ingreso</label><input type="date" className="w-full p-2 border rounded text-xs" value={ex.ingreso || ''} onChange={e => handleArrayChange('experiencia', 'adminPublica', idx, 'ingreso', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">F. Egreso</label><input type="date" className="w-full p-2 border rounded text-xs" value={ex.egreso || ''} onChange={e => handleArrayChange('experiencia', 'adminPublica', idx, 'egreso', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">Motivo del Retiro</label><input type="text" className="w-full p-2 border rounded text-xs" value={ex.motivo || ''} onChange={e => handleArrayChange('experiencia', 'adminPublica', idx, 'motivo', e.target.value)} /></div>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 bg-blue-50 p-4 border border-blue-100 rounded-lg">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">¿Es jubilado Admin Pública? <Req/> / Fecha y Org</label><div className="flex gap-2"><select className="w-1/3 p-2 border rounded bg-white text-xs" value={exp.esJubilado || ''} onChange={e => handleInputChange('experiencia', 'esJubilado', e.target.value)}><option value="">NO/SÍ</option><option value="SÍ">SÍ</option><option value="NO">NO</option></select><input type="text" placeholder="Fecha y Organismo" className="w-2/3 p-2 border rounded text-xs" value={exp.jubiladoDesc || ''} onChange={e => handleInputChange('experiencia', 'jubiladoDesc', e.target.value)} /></div></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">¿En proceso de jubilación? <Req/> / Organismo</label><div className="flex gap-2"><select className="w-1/3 p-2 border rounded bg-white text-xs" value={exp.enProcesoJubilacion || ''} onChange={e => handleInputChange('experiencia', 'enProcesoJubilacion', e.target.value)}><option value="">NO/SÍ</option><option value="SÍ">SÍ</option><option value="NO">NO</option></select><input type="text" placeholder="Organismo tramitante" className="w-2/3 p-2 border rounded text-xs" value={exp.procesoJubilacionDesc || ''} onChange={e => handleInputChange('experiencia', 'procesoJubilacionDesc', e.target.value)} /></div></div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-800 uppercase">Exp. Laboral Empresa Privada</h3>
                <button type="button" onClick={() => addRow('experiencia', 'empresaPrivada', { empresa: '', direccion: '', telefono: '', cargo: '', ingreso: '', egreso: '', motivo: '' })} className="text-xs bg-gray-200 px-3 py-1.5 rounded hover:bg-gray-300 flex items-center font-bold"><Plus size={14} className="mr-1"/> Añadir</button>
              </div>
              {(exp.empresaPrivada || []).map((ex, idx) => (
                <div key={idx} className="bg-gray-50 p-3 sm:p-4 border rounded-lg mb-4 relative">
                  <button type="button" onClick={() => removeRow('experiencia', 'empresaPrivada', idx)} className="absolute top-2 right-2 text-red-500 hover:bg-red-100 p-1.5 rounded"><Trash2 size={16} /></button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                    <div className="sm:col-span-2"><label className="block text-xs text-gray-600 mb-1">Empresa</label><input type="text" className="w-full p-2 border rounded text-xs" value={ex.empresa || ''} onChange={e => handleArrayChange('experiencia', 'empresaPrivada', idx, 'empresa', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">Dirección</label><input type="text" className="w-full p-2 border rounded text-xs" value={ex.direccion || ''} onChange={e => handleArrayChange('experiencia', 'empresaPrivada', idx, 'direccion', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">Teléfono(s)</label><input type="text" className="w-full p-2 border rounded text-xs" value={ex.telefono || ''} onChange={e => handleArrayChange('experiencia', 'empresaPrivada', idx, 'telefono', e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div><label className="block text-xs text-gray-600 mb-1">Último cargo</label><input type="text" className="w-full p-2 border rounded text-xs" value={ex.cargo || ''} onChange={e => handleArrayChange('experiencia', 'empresaPrivada', idx, 'cargo', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">F. Ingreso</label><input type="date" className="w-full p-2 border rounded text-xs" value={ex.ingreso || ''} onChange={e => handleArrayChange('experiencia', 'empresaPrivada', idx, 'ingreso', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">F. Egreso</label><input type="date" className="w-full p-2 border rounded text-xs" value={ex.egreso || ''} onChange={e => handleArrayChange('experiencia', 'empresaPrivada', idx, 'egreso', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">Motivo del Retiro</label><input type="text" className="w-full p-2 border rounded text-xs" value={ex.motivo || ''} onChange={e => handleArrayChange('experiencia', 'empresaPrivada', idx, 'motivo', e.target.value)} /></div>
                  </div>
                </div>
              ))}
            </div>

            {/* ================= PESTAÑA 6: HCM Y PÓLIZAS ================= */}
            <div className={activeTab === 5 ? 'block' : 'hidden'}>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2 border-b pb-2 flex items-center gap-2">
                <ShieldPlus className="text-blue-600" size={20} /> Fondo Administrado de Salud (HCM) y Pólizas
              </h3>
              <p className="text-xs text-gray-500 mb-6">Información institucional complementaria para la afiliación al fondo de salud de Movilnet[cite: 5, 6].</p>

              {/* Pregunta familiar en Movilnet */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                <label className="block text-xs font-bold text-blue-900 mb-2 uppercase">¿Posee algún familiar trabajando en Telecomunicaciones Movilnet C.A.? <Req/></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <select className="w-full p-2 border rounded bg-white text-xs sm:text-sm" value={hcm.familiarMovilnet || 'NO'} onChange={e => handleInputChange('hcmPolizas', 'familiarMovilnet', e.target.value)}>
                      <option value="NO">NO</option>
                      <option value="SÍ">SÍ</option>
                    </select>
                  </div>
                  {hcm.familiarMovilnet === 'SÍ' && (
                    <div>
                      <input type="text" placeholder="Indique el Parentesco y Nombres" className="w-full p-2 border rounded text-xs sm:text-sm bg-white" value={hcm.familiarMovilnetParentesco || ''} onChange={e => handleInputChange('hcmPolizas', 'familiarMovilnetParentesco', e.target.value)} required />
                    </div>
                  )}
                </div>
              </div>

              {/* Pólizas / Seguros vigentes */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-bold text-gray-800 uppercase">¿Mantiene otro Seguro o Fondo de Salud vigente?</h4>
                  <select className="p-1.5 border rounded bg-white text-xs font-bold" value={hcm.tieneOtroSeguro || 'NO'} onChange={e => handleInputChange('hcmPolizas', 'tieneOtroSeguro', e.target.value)}>
                    <option value="NO">NO</option>
                    <option value="SÍ">SÍ</option>
                  </select>
                </div>

                {hcm.tieneOtroSeguro === 'SÍ' && (
                  <div className="border rounded-lg p-4 bg-gray-50 mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-gray-700">Pólizas / Fondos Activos</span>
                      <button type="button" onClick={() => addRow('hcmPolizas', 'segurosVigentes', { empresaSeguros: '', nroPoliza: '', sumaAseguradora: '', deducible: '' })} className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded font-bold hover:bg-blue-200 flex items-center"><Plus size={14} className="mr-1"/> Agregar Póliza</button>
                    </div>
                    {(hcm.segurosVigentes || []).map((seg, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2 relative bg-white p-3 border rounded">
                        <div><label className="block text-[10px] text-gray-500">Empresa de Seguros</label><input type="text" className="w-full p-1.5 border rounded text-xs" value={seg.empresaSeguros || ''} onChange={e => handleArrayChange('hcmPolizas', 'segurosVigentes', idx, 'empresaSeguros', e.target.value)} /></div>
                        <div><label className="block text-[10px] text-gray-500">N° de Póliza o Fondo</label><input type="text" className="w-full p-1.5 border rounded text-xs" value={seg.nroPoliza || ''} onChange={e => handleArrayChange('hcmPolizas', 'segurosVigentes', idx, 'nroPoliza', e.target.value)} /></div>
                        <div><label className="block text-[10px] text-gray-500">Suma Aseguradora</label><input type="text" className="w-full p-1.5 border rounded text-xs" value={seg.sumaAseguradora || ''} onChange={e => handleArrayChange('hcmPolizas', 'segurosVigentes', idx, 'sumaAseguradora', e.target.value)} /></div>
                        <div className="flex gap-2 items-end">
                          <div className="flex-1"><label className="block text-[10px] text-gray-500">Deducible</label><input type="text" className="w-full p-1.5 border rounded text-xs" value={seg.deducible || ''} onChange={e => handleArrayChange('hcmPolizas', 'segurosVigentes', idx, 'deducible', e.target.value)} /></div>
                          <button type="button" onClick={() => removeRow('hcmPolizas', 'segurosVigentes', idx)} className="text-red-500 hover:bg-red-50 p-1 rounded h-8"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Beneficiarios en caso de Fallecimiento */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                  <h4 className="text-sm font-bold text-gray-800 uppercase">Beneficiarios en Caso de Fallecimiento</h4>
                  <button type="button" onClick={() => addRow('hcmPolizas', 'beneficiariosFallecimiento', { nombres: '', cedula: '', sexo: '', parentesco: '', porcentaje: '' })} className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded font-bold hover:bg-blue-200 flex items-center"><Plus size={14} className="mr-1"/> Añadir Beneficiario</button>
                </div>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs text-left bg-white min-w-[650px]">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="p-2 w-1/3">Apellidos y Nombres</th>
                        <th className="p-2">Cédula</th>
                        <th className="p-2 w-20">Sexo</th>
                        <th className="p-2">Parentesco</th>
                        <th className="p-2 w-24">% Participación</th>
                        <th className="p-2 w-10 text-center">X</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(hcm.beneficiariosFallecimiento || []).map((ben, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="p-1"><input type="text" className="w-full p-1.5 border rounded text-xs" value={ben.nombres || ''} onChange={e => handleArrayChange('hcmPolizas', 'beneficiariosFallecimiento', idx, 'nombres', e.target.value)} /></td>
                          <td className="p-1"><input type="text" className="w-full p-1.5 border rounded text-xs" value={ben.cedula || ''} onChange={e => handleArrayChange('hcmPolizas', 'beneficiariosFallecimiento', idx, 'cedula', e.target.value)} /></td>
                          <td className="p-1"><select className="w-full p-1.5 border rounded bg-white text-xs" value={ben.sexo || ''} onChange={e => handleArrayChange('hcmPolizas', 'beneficiariosFallecimiento', idx, 'sexo', e.target.value)}><option value="">SEL</option><option value="M">M</option><option value="F">F</option></select></td>
                          <td className="p-1"><input type="text" className="w-full p-1.5 border rounded text-xs uppercase" value={ben.parentesco || ''} onChange={e => handleArrayChange('hcmPolizas', 'beneficiariosFallecimiento', idx, 'parentesco', e.target.value)} /></td>
                          <td className="p-1"><input type="number" placeholder="Ej. 100" className="w-full p-1.5 border rounded text-xs" value={ben.porcentaje || ''} onChange={e => handleArrayChange('hcmPolizas', 'beneficiariosFallecimiento', idx, 'porcentaje', e.target.value)} /></td>
                          <td className="p-1 text-center"><button type="button" onClick={() => removeRow('hcmPolizas', 'beneficiariosFallecimiento', idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={14} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DECLARACIÓN DE SALUD (15 Puntos Oficiales Movilnet) */}
              <div className="mb-8 border rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-bold text-gray-800 mb-1 uppercase flex items-center gap-2">
                  <FileText className="text-blue-600" size={18} /> Declaración de Salud
                </h4>
                <p className="text-xs text-gray-600 mb-4 italic">
                  "Indique si alguien de su grupo familiar padece o ha padecido alguna de las siguientes enfermedades incluyendo trabajador, subrayar en caso de ser afirmativo"[cite: 6].
                </p>

                <div className="space-y-3 text-xs">
                  {[
                    { id: 'p1', label: '1. Enfermedades de la Piel (Dermatitis, Acné, Vitiligo, Manchas, Verrugas), Ojos (Cataratas), Oídos (Otitis), Nariz y Garganta (Sinusitis, Amigdalitis, Rinitis) o Respiratorias (Asma, Bronquitis, Neumonía).' },
                    { id: 'p2', label: '2. Enfermedades Cardiovasculares (Hipertensión Arterial, Infarto, Angina de pecho, Arritmias, Tromboflebitis).' },
                    { id: 'p3', label: '3. Cefaleas, desmayos, epilepsia, convulsiones, parálisis, retardo mental, trastorno mental, neuropatía, vértigos u otra afección del cerebro o sistema nervioso.' },
                    { id: 'p4', label: '4. Enfermedades Digestivas (Gastritis, Úlcera Péptica, Afecciones Hepáticas, Cálculos Vesiculares, Hemorroides, Páncreas, Colon).' },
                    { id: 'p5', label: '5. Enfermedades del Tracto Genito-Urinario (Infecciones en orina, cálculos renales, vejiga o próstata).' },
                    { id: 'p6', label: '6. Enfermedades de Transmisión Sexual, Infecciosas (Tuberculosis, Hepatitis, Meningitis, VPH, VIH/SIDA) o Parasitarias (Paludismo, Chagas, Amibiasis).' },
                    { id: 'p7', label: '7. Enfermedades del Aparato Osteomuscular (Neuritis, Ciática, Gota, Reumatismo, Hernias Discales, Artritis, Fracturas, Esguinces).' },
                    { id: 'p8', label: '8. Enfermedades del Sistema Endocrino (Diabetes, Obesidad, Bocio, Tiroides, Alteraciones del Colesterol, Triglicéridos).' },
                    { id: 'p9', label: '9. Ganglios linfáticos inflamados, Quistes, Tumores, Cáncer, Enfermedades hematológicas (Leucemia, Lepra, Herpes).' },
                    { id: 'p10', label: '10. Defectos físicos, anomalías o enfermedad congénita o adquirida. Trastornos del desarrollo psíquico y somático.' },
                    { id: 'p11', label: '11. ¿Alguna de las personas a ser incluidas consume alcohol, tabaco o cualquier otra droga adictiva?' },
                    { id: 'p12', label: '12. ¿Alguna de las personas ha tenido cambios de peso, ha sido donante/receptor de órganos o recibido transfusiones sanguíneas en los últimos 2 años?' },
                    { id: 'p13', label: '13. ¿Alguna de las personas a ser incluidas ha sido paciente de algún Hospital, Clínica o Sanatorio?' },
                    { id: 'p14', label: '14. ¿Alguna de las personas a ser incluidas se ha practicado algún chequeo, consulta médica por enfermedad o cirugía en los últimos cinco (5) años?' },
                    { id: 'p15', label: '15. ¿Tiene alguna otra condición o antecedente médico relevante no especificado?' }
                  ].map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-2.5 rounded border gap-2">
                      <span className="text-gray-800 font-medium flex-1">{item.label}</span>
                      <select 
                        className="p-1 border rounded bg-white font-bold text-xs w-24"
                        value={declSalud[item.id] || 'NO'}
                        onChange={e => handleNestedInputChange('hcmPolizas', 'declaracionSalud', item.id, e.target.value)}
                      >
                        <option value="NO">NO</option>
                        <option value="SÍ">SÍ</option>
                      </select>
                    </div>
                  ))}

                  <div className="mt-4">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Si marcó SÍ en alguna de las opciones anteriores, detalle a continuación la persona, enfermedad y observaciones:</label>
                    <textarea 
                      className="w-full p-2 border rounded text-xs bg-white" 
                      rows="3"
                      placeholder="Describa los detalles médicos..."
                      value={declSalud.detallesEnfermedades || ''}
                      onChange={e => handleNestedInputChange('hcmPolizas', 'declaracionSalud', 'detallesEnfermedades', e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* DECLARACIONES / LUGAR / FECHA / FIRMA */}
              <div className="bg-blue-50/70 p-4 rounded-lg border border-blue-200">
                <h4 className="text-xs font-bold text-blue-900 mb-2 uppercase">Declaración de Veracidad y Cierre</h4>
                <p className="text-xs text-gray-700 mb-4 text-justify">
                  "Yo declaro la exactitud y veracidad de toda la información arriba expresada y que nada he omitido, ocultando o disimulando, y estoy enterado que las falsedades y reticencias de mala fe por mi parte, podrían ir en contra del beneficio que ofrece el Fondo Administrado al cual pertenezco."[cite: 6]
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Lugar <Req/></label>
                    <input 
                      type="text" 
                      placeholder="Ej. CARACAS" 
                      className="w-full p-2 border rounded text-xs bg-white uppercase"
                      value={hcm.lugarDeclaracion || ''}
                      onChange={e => handleInputChange('hcmPolizas', 'lugarDeclaracion', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fecha <Req/></label>
                    <input 
                      type="date" 
                      className="w-full p-2 border rounded text-xs bg-white"
                      value={hcm.fechaDeclaracion || ''}
                      onChange={e => handleInputChange('hcmPolizas', 'fechaDeclaracion', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* ================= BARRA DE NAVEGACIÓN Y GUARDADO ================= */}
            <div className="mt-8 sm:mt-10 pt-4 sm:pt-5 border-t border-gray-200 flex flex-col gap-3 sm:gap-4 bg-gray-50 p-3 sm:p-4 rounded-lg">
              {validationErrors.length > 0 && (
                <div className="bg-red-50 text-red-600 text-xs sm:text-sm p-3 rounded-lg flex items-center border border-red-200 w-full font-medium">
                  <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                  No puede avanzar. Faltan los siguientes campos obligatorios: {validationErrors.join(', ')}.
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-3 sm:gap-4">
                <div className="flex gap-2 w-full sm:w-auto">
                  <button type="button" onClick={handlePrev} disabled={activeTab === 0} className="flex-1 sm:flex-none px-4 sm:px-5 py-2 text-gray-600 text-xs sm:text-sm font-medium hover:bg-gray-200 rounded disabled:opacity-30 flex items-center justify-center transition-colors"><ChevronLeft size={16} className="mr-1" /> Anterior</button>
                  <button type="button" onClick={handleSaveDraft} disabled={isSavingDraft || isSubmitting} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-blue-700 bg-blue-100 hover:bg-blue-200 text-xs sm:text-sm font-medium rounded flex items-center justify-center transition-colors disabled:opacity-50">{isSavingDraft ? 'Guardando...' : <><Save size={16} className="mr-1" /> Borrador</>}</button>
                </div>
                <div className="w-full sm:w-auto">
                  {activeTab < tabs.length - 1 ? (
                    <button type="button" onClick={handleNext} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 text-xs sm:text-sm rounded shadow flex items-center justify-center transition-colors">Siguiente <ChevronRight size={16} className="ml-1" /></button>
                  ) : (
                    <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 sm:px-8 text-xs sm:text-sm rounded shadow-md transition-colors flex items-center justify-center disabled:opacity-50">{isSubmitting ? 'Guardando...' : <><Save size={16} className="mr-2" /> Finalizar y Guardar</>}</button>
                  )}
                </div>
              </div>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
};

export default App;