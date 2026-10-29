import React, { useState } from 'react';
import { Save, CheckCircle, XCircle, AlertCircle, Plus, Trash2, Search, UserCheck, ChevronRight, ChevronLeft, Lock } from 'lucide-react';

const App = () => {
  // ================= ESTADOS =================
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [p00Input, setP00Input] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const [activeTab, setActiveTab] = useState(0);
  const [maxUnlockedTab, setMaxUnlockedTab] = useState(0);
  const [validationErrors, setValidationErrors] = useState([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const [formData, setFormData] = useState({
    datosPersonales: {
      nombres: '', apellidos: '', cedula: '', rif: '', lugarNacimiento: '', fechaNacimiento: '', 
      nacionalidad: '', gaceta: '', edad: '', sexo: '', grupoSanguineo: '', estadoCivil: '', habilidadMotriz: '',
      licencia: '', gradoLicencia: '', tipoVivienda: '', condicionVivienda: '', alergico: '', alergiaDesc: '',
      profesion: '', colegiado: '', nroColegiado: '', correo: '', tlfMovil: '', tlfLocal: '',
      carnetPatria: '', nroCarnetPatria: '', estatura: '', peso: '', tallaCamisa: '',
      tallaChemise: '', tallaFranela: '', tallaBluejean: '', tallaBota: '', tallaZapato: '', tallaCasco: ''
    },
    direccion: {
      estado: '', ciudad: '', municipio: '', parroquia: '', urbanizacion: '',
      sector: '', avenida: '', codigoPostal: '', inmueble: '', piso: '', apto: ''
    },
    educacion: {
      niveles: [
        { nivel: 'Primaria', graduado: '', titulo: '' },
        { nivel: 'Secundaria', graduado: '', titulo: '' },
        { nivel: 'Técnica', graduado: '', titulo: '' },
        { nivel: 'Universitaria', graduado: '', titulo: '' },
        { nivel: 'Post-Grado', graduado: '', titulo: '' }
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
    }
  });

  const tabs = ["1. Datos Personales", "2. Dirección", "3. Educación e Idiomas", "4. Familia y Salud", "5. Experiencia"];

  // ================= FUNCIONES DE CÁLCULO DE EDAD =================
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '';
    const hoy = new Date();
    const cumpleanos = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - cumpleanos.getFullYear();
    const m = hoy.getMonth() - cumpleanos.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
      edad--;
    }
    return edad.toString();
  };

  // ================= MANEJADORES DE DATOS =================
  const handleInputChange = (section, field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [section]: { ...prev[section], [field]: value } };
      
      // Cálculo automático de edad para el trabajador
      if (section === 'datosPersonales' && field === 'fechaNacimiento') {
        newData.datosPersonales.edad = calcularEdad(value);
      }
      return newData;
    });
    setValidationErrors([]); 
  };

  const handleArrayChange = (section, arrayName, index, field, value) => {
    setFormData(prev => {
      const newArray = [...prev[section][arrayName]];
      newArray[index] = { ...newArray[index], [field]: value };
      
      // Cálculo automático de edad para familiares dependientes
      if (section === 'actividadesFamilia' && arrayName === 'dependientes' && field === 'fechaNacimiento') {
        newArray[index].edad = calcularEdad(value);
      }
      
      return { ...prev, [section]: { ...prev[section], [arrayName]: newArray } };
    });
  };

  const addRow = (section, arrayName, emptyObject) => {
    setFormData(prev => ({ ...prev, [section]: { ...prev[section], [arrayName]: [...prev[section][arrayName], emptyObject] } }));
  };

  const removeRow = (section, arrayName, index) => {
    setFormData(prev => {
      const newArray = [...prev[section][arrayName]];
      newArray.splice(index, 1);
      return { ...prev, [section]: { ...prev[section], [arrayName]: newArray } };
    });
  };

  // ================= LÓGICA DE VALIDACIÓN SECUENCIAL =================
  const validateTab = (tabIndex) => {
    const errors = [];
    const dp = formData.datosPersonales;
    const dir = formData.direccion;
    const ed = formData.educacion;
    const fs = formData.actividadesFamilia;
    const exp = formData.experiencia;

    if (tabIndex === 0) {
      if (!dp.rif) errors.push("RIF");
      if (!dp.nacionalidad) errors.push("Nacionalidad");
      if (!dp.lugarNacimiento) errors.push("Lugar de Nacimiento");
      if (!dp.fechaNacimiento) errors.push("Fecha de Nacimiento");
      if (!dp.sexo) errors.push("Sexo");
      if (!dp.estadoCivil) errors.push("Estado Civil");
      if (!dp.correo) errors.push("Correo Electrónico");
      if (!dp.tlfMovil) errors.push("Teléfono Móvil");
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
      if (!fs.tomaMedicamento) errors.push("¿Toma medicamento?");
    } else if (tabIndex === 4) {
      if (!exp.esJubilado) errors.push("¿Es jubilado?");
      if (!exp.enProcesoJubilacion) errors.push("¿En proceso de jubilación?");
    }
    return errors;
  };

  const handleNext = () => {
    const errors = validateTab(activeTab);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
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

  // ================= LOGIN & SUBMIT =================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setIsSearching(true);
    try {
      const response = await fetch(`/api/trabajador/${p00Input}`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.datos_previos) {
          setFormData(data.datos_previos);
          setMaxUnlockedTab(4);
        } else {
          setFormData(prev => ({
            ...prev,
            datosPersonales: {
              ...prev.datosPersonales,
              nombres: data.nombres,
              apellidos: data.apellidos,
              cedula: data.cedula
            }
          }));
          setMaxUnlockedTab(0); 
        }
        setIsAuthenticated(true);
      } else {
        setLoginError('El número de personal (P00) no se encuentra registrado en SAP.');
      }
    } catch (error) {
      setLoginError('Error de conexión con la base de datos.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateTab(4);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const response = await fetch('/api/oferta-servicio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setSubmitStatus('success');
        window.scrollTo(0, 0);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const Req = () => <span className="text-red-500 ml-1" title="Campo obligatorio">*</span>;

  // ================= PANTALLA LOGIN =================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md overflow-hidden">
          <div className="bg-blue-900 text-white p-6 text-center">
            <h1 className="text-2xl font-bold">Movilnet C.A.</h1>
            <h2 className="text-sm text-blue-200 mt-1">Gestión Humana - Oferta de Servicio</h2>
          </div>
          <form onSubmit={handleLogin} className="p-8">
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Número de Personal (P00)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserCheck className="h-5 w-5 text-gray-400" /></div>
                <input type="text" placeholder="Ej. P0012345" className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none uppercase font-medium" value={p00Input} onChange={(e) => setP00Input(e.target.value.toUpperCase())} required />
              </div>
            </div>
            {loginError && <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm border-l-4 border-red-500 rounded font-medium">{loginError}</div>}
            <button type="submit" disabled={isSearching || !p00Input} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center disabled:opacity-50 transition-colors">
              {isSearching ? 'Consultando BD...' : <><Search size={18} className="mr-2" /> Buscar y Continuar</>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ================= PANTALLA PRINCIPAL (FORMULARIO) =================
  return (
    <div className="min-h-screen bg-gray-100 text-left pb-12 font-sans">
      <header className="bg-blue-900 text-white p-5 shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Telecomunicaciones Movilnet C.A.</h1>
            <h2 className="text-sm text-blue-200 mt-1">Gerencia General de Gestión Humana - Actualización de Oferta de Servicio</h2>
          </div>
          <div className="bg-blue-800 p-3 rounded-lg border border-blue-700 min-w-[250px] relative">
             <button onClick={() => {setIsAuthenticated(false); setSubmitStatus(null); setP00Input(''); setMaxUnlockedTab(0); setActiveTab(0);}} className="absolute top-2 right-2 text-blue-300 hover:text-white text-xs underline">Salir</button>
            <p className="text-sm font-semibold uppercase pr-8">{formData.datosPersonales.nombres} {formData.datosPersonales.apellidos}</p>
            <p className="text-xs text-blue-300">C.I: {formData.datosPersonales.cedula} | {p00Input}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-6 px-4">
        {submitStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded flex items-start shadow-sm">
            <CheckCircle className="text-green-500 mr-3 mt-0.5" />
            <div><h3 className="text-green-800 font-bold">¡Datos guardados exitosamente!</h3><p className="text-green-700 text-sm mt-1">La información ha sido registrada. Puede salir o seguir editando.</p></div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          
          <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
            {tabs.map((tab, idx) => (
              <button 
                key={idx} 
                type="button" 
                onClick={() => { if(idx <= maxUnlockedTab) setActiveTab(idx); }} 
                disabled={idx > maxUnlockedTab}
                className={`px-5 py-4 text-sm font-bold whitespace-nowrap transition-colors flex-1 text-center flex items-center justify-center gap-2
                  ${activeTab === idx ? 'border-b-4 border-blue-600 text-blue-800 bg-white' : ''}
                  ${idx > maxUnlockedTab ? 'text-gray-400 cursor-not-allowed opacity-60 bg-gray-100' : 'text-gray-600 hover:bg-gray-100'}
                  ${idx <= maxUnlockedTab && activeTab !== idx ? 'text-gray-700 hover:text-blue-600' : ''}
                `}
              >
                {tab}
                {idx > maxUnlockedTab && <Lock size={14} className="text-gray-400" />}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            
            {/* ================= PESTAÑA 1 ================= */}
            <div className={activeTab === 0 ? 'block' : 'hidden'}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Cédula de Identidad</label><input type="text" value={formData.datosPersonales.cedula} disabled className="w-full p-2 border rounded bg-gray-200 text-gray-700" /></div>
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Nombres</label><input type="text" value={formData.datosPersonales.nombres} disabled className="w-full p-2 border rounded bg-gray-200 text-gray-700" /></div>
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Apellidos</label><input type="text" value={formData.datosPersonales.apellidos} disabled className="w-full p-2 border rounded bg-gray-200 text-gray-700" /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">RIF <Req/></label><input type="text" className="w-full p-2 border rounded" value={formData.datosPersonales.rif} onChange={e => handleInputChange('datosPersonales', 'rif', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Nacionalidad <Req/></label><select className="w-full p-2 border rounded bg-white" value={formData.datosPersonales.nacionalidad} onChange={e => handleInputChange('datosPersonales', 'nacionalidad', e.target.value)}><option value="">Seleccione</option><option>V</option><option>E</option></select></div>
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Si es naturalizado indique Gaceta</label><input type="text" className="w-full p-2 border rounded" value={formData.datosPersonales.gaceta} onChange={e => handleInputChange('datosPersonales', 'gaceta', e.target.value)} /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Lugar de Nacimiento <Req/></label><input type="text" className="w-full p-2 border rounded" value={formData.datosPersonales.lugarNacimiento} onChange={e => handleInputChange('datosPersonales', 'lugarNacimiento', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Fecha de Nacimiento <Req/></label><input type="date" className="w-full p-2 border rounded" value={formData.datosPersonales.fechaNacimiento} onChange={e => handleInputChange('datosPersonales', 'fechaNacimiento', e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Edad <Req/></label><input type="number" readOnly placeholder="Autocalculado" className="w-full p-2 border rounded bg-gray-100 text-gray-600" value={formData.datosPersonales.edad} /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Sexo <Req/></label><select className="w-full p-2 border rounded bg-white" value={formData.datosPersonales.sexo} onChange={e => handleInputChange('datosPersonales', 'sexo', e.target.value)}><option value="">Sel</option><option>M</option><option>F</option></select></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 border-t pt-4">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Grupo Sanguíneo</label><input type="text" className="w-full p-2 border rounded" value={formData.datosPersonales.grupoSanguineo} onChange={e => handleInputChange('datosPersonales', 'grupoSanguineo', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Estado Civil <Req/></label><select className="w-full p-2 border rounded bg-white" value={formData.datosPersonales.estadoCivil} onChange={e => handleInputChange('datosPersonales', 'estadoCivil', e.target.value)}><option value="">Seleccione</option><option>Soltero</option><option>Casado</option><option>Viudo</option><option>Divorciado</option><option>Concubino</option></select></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Habilidad Motriz</label><select className="w-full p-2 border rounded bg-white" value={formData.datosPersonales.habilidadMotriz} onChange={e => handleInputChange('datosPersonales', 'habilidadMotriz', e.target.value)}><option value="">Seleccione</option><option>Diestro</option><option>Zurdo</option><option>Ambidiestro</option></select></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Licencia de Conducir / Grado</label><div className="flex gap-2"><input type="text" placeholder="Nro" className="w-2/3 p-2 border rounded" value={formData.datosPersonales.licencia} onChange={e => handleInputChange('datosPersonales', 'licencia', e.target.value)} /><input type="text" placeholder="Grado" className="w-1/3 p-2 border rounded" value={formData.datosPersonales.gradoLicencia} onChange={e => handleInputChange('datosPersonales', 'gradoLicencia', e.target.value)} /></div></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 border-t pt-4">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Vivienda</label><select className="w-full p-2 border rounded bg-white" value={formData.datosPersonales.tipoVivienda} onChange={e => handleInputChange('datosPersonales', 'tipoVivienda', e.target.value)}><option value="">Seleccione</option><option>Casa</option><option>Apartamento</option><option>Quinta</option><option>Otro</option></select></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Condición Vivienda</label><select className="w-full p-2 border rounded bg-white" value={formData.datosPersonales.condicionVivienda} onChange={e => handleInputChange('datosPersonales', 'condicionVivienda', e.target.value)}><option value="">Seleccione</option><option>Propia</option><option>Alquilada</option><option>Familiar</option><option>Otra</option></select></div>
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">¿Es Ud. Alérgico? / Indique</label><div className="flex gap-2"><select className="w-1/3 p-2 border rounded bg-white" value={formData.datosPersonales.alergico} onChange={e => handleInputChange('datosPersonales', 'alergico', e.target.value)}><option value="">No / Sí</option><option>Sí</option><option>No</option></select><input type="text" placeholder="Especifique si aplica" className="w-2/3 p-2 border rounded" value={formData.datosPersonales.alergiaDesc} onChange={e => handleInputChange('datosPersonales', 'alergiaDesc', e.target.value)} /></div></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 border-t pt-4">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Profesión u Oficio</label><input type="text" className="w-full p-2 border rounded" value={formData.datosPersonales.profesion} onChange={e => handleInputChange('datosPersonales', 'profesion', e.target.value)} /></div>
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">¿Está Ud. Colegiado? / Nro</label><div className="flex gap-2"><select className="w-1/3 p-2 border rounded bg-white" value={formData.datosPersonales.colegiado} onChange={e => handleInputChange('datosPersonales', 'colegiado', e.target.value)}><option value="">No / Sí</option><option>Sí</option><option>No</option></select><input type="text" placeholder="Nro de Colegio" className="w-2/3 p-2 border rounded" value={formData.datosPersonales.nroColegiado} onChange={e => handleInputChange('datosPersonales', 'nroColegiado', e.target.value)} /></div></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 border-t pt-4">
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Correo Electrónico Personal <Req/></label><input type="email" className="w-full p-2 border rounded" value={formData.datosPersonales.correo} onChange={e => handleInputChange('datosPersonales', 'correo', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Teléfono Móvil <Req/></label><input type="tel" className="w-full p-2 border rounded" value={formData.datosPersonales.tlfMovil} onChange={e => handleInputChange('datosPersonales', 'tlfMovil', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Teléfono Local</label><input type="tel" className="w-full p-2 border rounded" value={formData.datosPersonales.tlfLocal} onChange={e => handleInputChange('datosPersonales', 'tlfLocal', e.target.value)} /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">¿Posee Carnet de la Patria? / Nro</label><div className="flex gap-2"><select className="w-1/3 p-2 border rounded bg-white" value={formData.datosPersonales.carnetPatria} onChange={e => handleInputChange('datosPersonales', 'carnetPatria', e.target.value)}><option value="">No / Sí</option><option>Sí</option><option>No</option></select><input type="text" placeholder="Nro Carnet" className="w-2/3 p-2 border rounded" value={formData.datosPersonales.nroCarnetPatria} onChange={e => handleInputChange('datosPersonales', 'nroCarnetPatria', e.target.value)} /></div></div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border mt-6">
                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase">Tallas y Medidas</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div><label className="block text-xs text-gray-600 mb-1">Estatura <Req/></label><input type="text" placeholder="Ej. 1.75m" className="w-full p-2 border rounded text-sm" value={formData.datosPersonales.estatura} onChange={e => handleInputChange('datosPersonales', 'estatura', e.target.value)} /></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Peso <Req/></label><input type="text" placeholder="Ej. 75kg" className="w-full p-2 border rounded text-sm" value={formData.datosPersonales.peso} onChange={e => handleInputChange('datosPersonales', 'peso', e.target.value)} /></div>
                  
                  {/* SELECTS PARA ROPA SUPERIOR */}
                  <div><label className="block text-xs text-gray-600 mb-1">Camisa</label><select className="w-full p-2 border rounded text-sm bg-white" value={formData.datosPersonales.tallaCamisa} onChange={e => handleInputChange('datosPersonales', 'tallaCamisa', e.target.value)}><option value="">Sel...</option><option>SS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option><option>XXXL</option></select></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Chemise</label><select className="w-full p-2 border rounded text-sm bg-white" value={formData.datosPersonales.tallaChemise} onChange={e => handleInputChange('datosPersonales', 'tallaChemise', e.target.value)}><option value="">Sel...</option><option>SS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option><option>XXXL</option></select></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Franela</label><select className="w-full p-2 border rounded text-sm bg-white" value={formData.datosPersonales.tallaFranela} onChange={e => handleInputChange('datosPersonales', 'tallaFranela', e.target.value)}><option value="">Sel...</option><option>SS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option><option>XXXL</option></select></div>
                  
                  {/* TEXTOS DE EJEMPLO PARA EL RESTO */}
                  <div><label className="block text-xs text-gray-600 mb-1">Bluejean</label><input type="text" placeholder="Ej. 32" className="w-full p-2 border rounded text-sm" value={formData.datosPersonales.tallaBluejean} onChange={e => handleInputChange('datosPersonales', 'tallaBluejean', e.target.value)} /></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Bota Seg.</label><input type="text" placeholder="Ej. 42" className="w-full p-2 border rounded text-sm" value={formData.datosPersonales.tallaBota} onChange={e => handleInputChange('datosPersonales', 'tallaBota', e.target.value)} /></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Zapatos</label><input type="text" placeholder="Ej. 42" className="w-full p-2 border rounded text-sm" value={formData.datosPersonales.tallaZapato} onChange={e => handleInputChange('datosPersonales', 'tallaZapato', e.target.value)} /></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Casco</label><input type="text" placeholder="Ej. L o 58cm" className="w-full p-2 border rounded text-sm" value={formData.datosPersonales.tallaCasco} onChange={e => handleInputChange('datosPersonales', 'tallaCasco', e.target.value)} /></div>
                </div>
              </div>
            </div>

            {/* ================= PESTAÑA 2 ================= */}
            <div className={activeTab === 1 ? 'block' : 'hidden'}>
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Dirección de Habitación</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Estado <Req/></label><input type="text" className="w-full p-2 border rounded" value={formData.direccion.estado} onChange={e => handleInputChange('direccion', 'estado', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Ciudad <Req/></label><input type="text" className="w-full p-2 border rounded" value={formData.direccion.ciudad} onChange={e => handleInputChange('direccion', 'ciudad', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Municipio <Req/></label><input type="text" className="w-full p-2 border rounded" value={formData.direccion.municipio} onChange={e => handleInputChange('direccion', 'municipio', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Parroquia <Req/></label><input type="text" className="w-full p-2 border rounded" value={formData.direccion.parroquia} onChange={e => handleInputChange('direccion', 'parroquia', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Urbanización</label><input type="text" className="w-full p-2 border rounded" value={formData.direccion.urbanizacion} onChange={e => handleInputChange('direccion', 'urbanizacion', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Sector</label><input type="text" className="w-full p-2 border rounded" value={formData.direccion.sector} onChange={e => handleInputChange('direccion', 'sector', e.target.value)} /></div>
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Avenida, calle o cruce <Req/></label><input type="text" className="w-full p-2 border rounded" value={formData.direccion.avenida} onChange={e => handleInputChange('direccion', 'avenida', e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Código Postal</label><input type="text" className="w-full p-2 border rounded" value={formData.direccion.codigoPostal} onChange={e => handleInputChange('direccion', 'codigoPostal', e.target.value)} /></div>
              </div>
              <div className="bg-gray-50 p-4 border rounded-lg">
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Identificación del Inmueble</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><input type="text" placeholder="Edf./Res./Casa" className="w-full p-2 border rounded" value={formData.direccion.inmueble} onChange={e => handleInputChange('direccion', 'inmueble', e.target.value)} /></div>
                  <div><input type="text" placeholder="Piso o Nivel" className="w-full p-2 border rounded" value={formData.direccion.piso} onChange={e => handleInputChange('direccion', 'piso', e.target.value)} /></div>
                  <div><input type="text" placeholder="Apto. o N°" className="w-full p-2 border rounded" value={formData.direccion.apto} onChange={e => handleInputChange('direccion', 'apto', e.target.value)} /></div>
                </div>
              </div>
            </div>

            {/* ================= PESTAÑA 3 ================= */}
            <div className={activeTab === 2 ? 'block' : 'hidden'}>
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Educación Formal</h3>
              <div className="overflow-x-auto mb-8 border rounded-lg">
                <table className="w-full text-sm text-left bg-white">
                  <thead className="text-xs text-gray-700 bg-gray-100 border-b">
                    <tr>
                      <th className="p-3 w-1/4">Nivel</th>
                      <th className="p-3 w-1/4">Graduado</th>
                      <th className="p-3">Título Obtenido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.educacion.niveles.map((nivel, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-semibold text-gray-700">{nivel.nivel}</td>
                        <td className="p-3"><select className="w-full p-2 border rounded bg-white text-xs" value={nivel.graduado} onChange={e => handleArrayChange('educacion', 'niveles', idx, 'graduado', e.target.value)}><option value="">Sel...</option><option>Sí</option><option>No</option></select></td>
                        <td className="p-3"><input type="text" className="w-full p-2 border rounded text-xs" value={nivel.titulo} onChange={e => handleArrayChange('educacion', 'niveles', idx, 'titulo', e.target.value)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8 bg-blue-50 p-4 border border-blue-100 rounded-lg">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">¿Estudia Act? <Req/></label><select className="w-full p-2 border rounded bg-white" value={formData.educacion.estudiaActualmente} onChange={e => handleInputChange('educacion', 'estudiaActualmente', e.target.value)}><option value="">No / Sí</option><option>Sí</option><option>No</option></select></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Horario</label><input type="text" className="w-full p-2 border rounded" value={formData.educacion.horario} onChange={e => handleInputChange('educacion', 'horario', e.target.value)} /></div>
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Institución</label><input type="text" className="w-full p-2 border rounded" value={formData.educacion.institucion} onChange={e => handleInputChange('educacion', 'institucion', e.target.value)} /></div>
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Carrera</label><input type="text" className="w-full p-2 border rounded" value={formData.educacion.carrera} onChange={e => handleInputChange('educacion', 'carrera', e.target.value)} /></div>
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Nivel Alcanzado</label><input type="text" className="w-full p-2 border rounded" value={formData.educacion.nivelAlcanzado} onChange={e => handleInputChange('educacion', 'nivelAlcanzado', e.target.value)} /></div>
                <div className="col-span-4"><label className="block text-xs font-medium text-gray-700 mb-1">¿Cómo se traslada desde casa a universidad/trabajo? <Req/></label><input type="text" className="w-full p-2 border rounded" value={formData.educacion.traslado} onChange={e => handleInputChange('educacion', 'traslado', e.target.value)} /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-1">Idiomas</h4>
                  {formData.programasIdiomas.idiomas.map((idioma, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input type="text" placeholder={`${idx+1}) Indique Idioma`} className="w-1/2 p-2 border rounded text-xs" value={idioma.idioma} onChange={e => handleArrayChange('programasIdiomas', 'idiomas', idx, 'idioma', e.target.value)} />
                      <select className="w-1/4 p-2 border rounded bg-white text-xs" value={idioma.nivelHablado} onChange={e => handleArrayChange('programasIdiomas', 'idiomas', idx, 'nivelHablado', e.target.value)}><option value="">Hablado</option><option>Básico</option><option>Medio</option><option>Avanzado</option></select>
                      <select className="w-1/4 p-2 border rounded bg-white text-xs" value={idioma.nivelEscrito} onChange={e => handleArrayChange('programasIdiomas', 'idiomas', idx, 'nivelEscrito', e.target.value)}><option value="">Escrito</option><option>Básico</option><option>Medio</option><option>Avanzado</option></select>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-1">Programas Informáticos</h4>
                  {formData.programasIdiomas.programas.map((prog, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input type="text" placeholder={`${idx+1}) Señale el Programa`} className="w-2/3 p-2 border rounded text-xs" value={prog.programa} onChange={e => handleArrayChange('programasIdiomas', 'programas', idx, 'programa', e.target.value)} />
                      <select className="w-1/3 p-2 border rounded bg-white text-xs" value={prog.nivelDominio} onChange={e => handleArrayChange('programasIdiomas', 'programas', idx, 'nivelDominio', e.target.value)}><option value="">Nivel</option><option>Básico</option><option>Medio</option><option>Avanzado</option></select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ================= PESTAÑA 4 ================= */}
            <div className={activeTab === 3 ? 'block' : 'hidden'}>
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-lg font-bold text-gray-800">Personas Dependientes</h3>
                <button type="button" onClick={() => addRow('actividadesFamilia', 'dependientes', { nombres: '', cedula: '', fechaNacimiento: '', edad: '', parentesco: '', discapacidad: '' })} className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200 flex items-center font-bold">
                  <Plus size={16} className="mr-1"/> Añadir Familiar
                </button>
              </div>
              <div className="overflow-x-auto mb-8 border rounded-lg">
                <table className="w-full text-xs text-left bg-white">
                  <thead className="bg-gray-100 border-b">
                    <tr><th className="p-2 w-1/4">Apellidos y Nombres</th><th className="p-2">Cédula</th><th className="p-2">F. Nacimiento</th><th className="p-2 w-16">Edad</th><th className="p-2">Parentesco</th><th className="p-2">Discapacidad</th><th className="p-2 w-10 text-center">X</th></tr>
                  </thead>
                  <tbody>
                    {formData.actividadesFamilia.dependientes.map((dep, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-1"><input type="text" className="w-full p-1 border rounded" value={dep.nombres} onChange={e => handleArrayChange('actividadesFamilia', 'dependientes', idx, 'nombres', e.target.value)} /></td>
                        <td className="p-1"><input type="text" className="w-full p-1 border rounded" value={dep.cedula} onChange={e => handleArrayChange('actividadesFamilia', 'dependientes', idx, 'cedula', e.target.value)} /></td>
                        
                        {/* Fecha de Nacimiento e Input de Edad (Autocalculado) */}
                        <td className="p-1"><input type="date" className="w-full p-1 border rounded" value={dep.fechaNacimiento} onChange={e => handleArrayChange('actividadesFamilia', 'dependientes', idx, 'fechaNacimiento', e.target.value)} /></td>
                        <td className="p-1"><input type="number" readOnly placeholder="Autocalc." className="w-full p-1 border rounded bg-gray-100 text-gray-600" value={dep.edad} /></td>
                        
                        <td className="p-1"><input type="text" className="w-full p-1 border rounded" value={dep.parentesco} onChange={e => handleArrayChange('actividadesFamilia', 'dependientes', idx, 'parentesco', e.target.value)} /></td>
                        <td className="p-1"><input type="text" className="w-full p-1 border rounded" value={dep.discapacidad} onChange={e => handleArrayChange('actividadesFamilia', 'dependientes', idx, 'discapacidad', e.target.value)} /></td>
                        <td className="p-1 text-center"><button type="button" onClick={() => removeRow('actividadesFamilia', 'dependientes', idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-1">Salud del Trabajador</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">¿Posee discapacidad? <Req/> / Especifique</label><div className="flex gap-2"><select className="w-1/4 p-2 border rounded bg-white" value={formData.actividadesFamilia.discapacidadPropia} onChange={e => handleInputChange('actividadesFamilia', 'discapacidadPropia', e.target.value)}><option value="">No/Sí</option><option>Sí</option><option>No</option></select><input type="text" placeholder="Especifique" className="w-3/4 p-2 border rounded" value={formData.actividadesFamilia.discapacidadDesc} onChange={e => handleInputChange('actividadesFamilia', 'discapacidadDesc', e.target.value)} /></div></div>
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Indique el N° de Carnet CONAPDIS</label><input type="text" className="w-full p-2 border rounded" value={formData.actividadesFamilia.carnetConapdis} onChange={e => handleInputChange('actividadesFamilia', 'carnetConapdis', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">¿Toma medicamento? <Req/> / Cuál y Frec.</label><div className="flex gap-2"><select className="w-1/4 p-2 border rounded bg-white" value={formData.actividadesFamilia.tomaMedicamento} onChange={e => handleInputChange('actividadesFamilia', 'tomaMedicamento', e.target.value)}><option value="">No/Sí</option><option>Sí</option><option>No</option></select><input type="text" placeholder="Cuál y frecuencia" className="w-3/4 p-2 border rounded" value={formData.actividadesFamilia.medicamentoCual} onChange={e => handleInputChange('actividadesFamilia', 'medicamentoCual', e.target.value)} /></div></div>
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Indique desde cuándo y su motivo</label><input type="text" className="w-full p-2 border rounded" value={formData.actividadesFamilia.medicamentoMotivo} onChange={e => handleInputChange('actividadesFamilia', 'medicamentoMotivo', e.target.value)} /></div>
              </div>
            </div>

            {/* ================= PESTAÑA 5 ================= */}
            <div className={activeTab === 4 ? 'block' : 'hidden'}>
              
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-800 uppercase">Exp. Laboral Admin Pública</h3>
                <button type="button" onClick={() => addRow('experiencia', 'adminPublica', { organismo: '', direccion: '', telefono: '', cargo: '', ingreso: '', egreso: '', motivo: '' })} className="text-xs bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 flex items-center font-bold"><Plus size={14} className="mr-1"/> Añadir</button>
              </div>
              <p className="text-xs text-gray-500 mb-3 border-b pb-2">Comenzando por el último o actual</p>
              
              {formData.experiencia.adminPublica.map((exp, idx) => (
                <div key={idx} className="bg-gray-50 p-4 border rounded-lg mb-4 relative">
                  <button type="button" onClick={() => removeRow('experiencia', 'adminPublica', idx)} className="absolute top-2 right-2 text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={16} /></button>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
                    <div className="col-span-2"><label className="block text-xs text-gray-600 mb-1">Organismo</label><input type="text" className="w-full p-2 border rounded text-xs" value={exp.organismo} onChange={e => handleArrayChange('experiencia', 'adminPublica', idx, 'organismo', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">Dirección</label><input type="text" className="w-full p-2 border rounded text-xs" value={exp.direccion} onChange={e => handleArrayChange('experiencia', 'adminPublica', idx, 'direccion', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">Teléfono(s)</label><input type="text" className="w-full p-2 border rounded text-xs" value={exp.telefono} onChange={e => handleArrayChange('experiencia', 'adminPublica', idx, 'telefono', e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div><label className="block text-xs text-gray-600 mb-1">Último cargo</label><input type="text" className="w-full p-2 border rounded text-xs" value={exp.cargo} onChange={e => handleArrayChange('experiencia', 'adminPublica', idx, 'cargo', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">F. Ingreso</label><input type="date" className="w-full p-2 border rounded text-xs" value={exp.ingreso} onChange={e => handleArrayChange('experiencia', 'adminPublica', idx, 'ingreso', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">F. Egreso</label><input type="date" className="w-full p-2 border rounded text-xs" value={exp.egreso} onChange={e => handleArrayChange('experiencia', 'adminPublica', idx, 'egreso', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">Motivo del Retiro</label><input type="text" className="w-full p-2 border rounded text-xs" value={exp.motivo} onChange={e => handleArrayChange('experiencia', 'adminPublica', idx, 'motivo', e.target.value)} /></div>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-blue-50 p-4 border border-blue-100 rounded-lg">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">¿Es jubilado Admin Pública? <Req/> / Fecha y Org</label><div className="flex gap-2"><select className="w-1/3 p-2 border rounded bg-white" value={formData.experiencia.esJubilado} onChange={e => handleInputChange('experiencia', 'esJubilado', e.target.value)}><option value="">No/Sí</option><option>Sí</option><option>No</option></select><input type="text" placeholder="Fecha y Organismo" className="w-2/3 p-2 border rounded" value={formData.experiencia.jubiladoDesc} onChange={e => handleInputChange('experiencia', 'jubiladoDesc', e.target.value)} /></div></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">¿En proceso de jubilación? <Req/> / Organismo</label><div className="flex gap-2"><select className="w-1/3 p-2 border rounded bg-white" value={formData.experiencia.enProcesoJubilacion} onChange={e => handleInputChange('experiencia', 'enProcesoJubilacion', e.target.value)}><option value="">No/Sí</option><option>Sí</option><option>No</option></select><input type="text" placeholder="Organismo tramitante" className="w-2/3 p-2 border rounded" value={formData.experiencia.procesoJubilacionDesc} onChange={e => handleInputChange('experiencia', 'procesoJubilacionDesc', e.target.value)} /></div></div>
              </div>

              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-800 uppercase">Exp. Laboral Empresa Privada</h3>
                <button type="button" onClick={() => addRow('experiencia', 'empresaPrivada', { empresa: '', direccion: '', telefono: '', cargo: '', ingreso: '', egreso: '', motivo: '' })} className="text-xs bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 flex items-center font-bold"><Plus size={14} className="mr-1"/> Añadir</button>
              </div>
              
              {formData.experiencia.empresaPrivada.map((exp, idx) => (
                <div key={idx} className="bg-gray-50 p-4 border rounded-lg mb-4 relative">
                  <button type="button" onClick={() => removeRow('experiencia', 'empresaPrivada', idx)} className="absolute top-2 right-2 text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={16} /></button>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
                    <div className="col-span-2"><label className="block text-xs text-gray-600 mb-1">Empresa</label><input type="text" className="w-full p-2 border rounded text-xs" value={exp.empresa} onChange={e => handleArrayChange('experiencia', 'empresaPrivada', idx, 'empresa', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">Dirección</label><input type="text" className="w-full p-2 border rounded text-xs" value={exp.direccion} onChange={e => handleArrayChange('experiencia', 'empresaPrivada', idx, 'direccion', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">Teléfono(s)</label><input type="text" className="w-full p-2 border rounded text-xs" value={exp.telefono} onChange={e => handleArrayChange('experiencia', 'empresaPrivada', idx, 'telefono', e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div><label className="block text-xs text-gray-600 mb-1">Último cargo</label><input type="text" className="w-full p-2 border rounded text-xs" value={exp.cargo} onChange={e => handleArrayChange('experiencia', 'empresaPrivada', idx, 'cargo', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">F. Ingreso</label><input type="date" className="w-full p-2 border rounded text-xs" value={exp.ingreso} onChange={e => handleArrayChange('experiencia', 'empresaPrivada', idx, 'ingreso', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">F. Egreso</label><input type="date" className="w-full p-2 border rounded text-xs" value={exp.egreso} onChange={e => handleArrayChange('experiencia', 'empresaPrivada', idx, 'egreso', e.target.value)} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">Motivo del Retiro</label><input type="text" className="w-full p-2 border rounded text-xs" value={exp.motivo} onChange={e => handleArrayChange('experiencia', 'empresaPrivada', idx, 'motivo', e.target.value)} /></div>
                  </div>
                </div>
              ))}
            </div>

            {/* ================= BARRA DE NAVEGACIÓN Y GUARDADO ================= */}
            <div className="mt-10 pt-5 border-t border-gray-200 flex flex-col gap-4 bg-gray-50 p-4 rounded-lg">
              
              {validationErrors.length > 0 && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center border border-red-200 w-full font-medium">
                  <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                  No puede avanzar. Faltan los siguientes campos obligatorios: {validationErrors.join(', ')}.
                </div>
              )}

              <div className="flex justify-between items-center w-full">
                <button type="button" onClick={handlePrev} disabled={activeTab === 0} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded disabled:opacity-30 flex items-center transition-colors">
                  <ChevronLeft size={18} className="mr-1" /> Anterior
                </button>

                {activeTab < tabs.length - 1 ? (
                  <button type="button" onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow flex items-center transition-colors">
                    Siguiente <ChevronRight size={18} className="ml-1" />
                  </button>
                ) : (
                  <button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-8 rounded shadow-md transition-colors flex items-center disabled:opacity-50">
                    {isSubmitting ? 'Guardando...' : <><Save size={18} className="mr-2" /> Finalizar y Guardar</>}
                  </button>
                )}
              </div>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
};

export default App;