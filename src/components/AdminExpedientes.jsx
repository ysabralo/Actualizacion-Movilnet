import React, { useState } from 'react';
import { 
  Search, CheckCircle2, XCircle, AlertTriangle, FileText, Save, 
  ArrowLeft, ShieldCheck, User, Lock, LogOut, ShieldAlert, 
  ChevronRight, ChevronLeft, Check, AlertCircle, Info, 
  Home, GraduationCap, Users, Briefcase, HeartPulse, CheckSquare,
  Eye, EyeOff
} from 'lucide-react';

const initialSupports = [
  // Pestaña 0: Datos Personales
  { id: 'ci', tab: 0, categoria: 'Datos Personales', documento: 'Copia de Cédula de Identidad (Vigente y Legible)', estado: 'PENDIENTE', obs: '' },
  { id: 'rif', tab: 0, categoria: 'Datos Personales', documento: 'Comprobante de RIF Actualizado (Módulo 11)', estado: 'PENDIENTE', obs: '' },
  { id: 'partida_nac', tab: 0, categoria: 'Datos Personales', documento: 'Partida de Nacimiento del Trabajador', estado: 'PENDIENTE', obs: '' },
  { id: 'matrimonio_concubinato', tab: 0, categoria: 'Datos Personales', documento: 'Acta de Matrimonio / Constancia de Unión Estable', estado: 'NO_APLICA', obs: '' },
  { id: 'gaceta_naturalizacion', tab: 0, categoria: 'Datos Personales', documento: 'Gaceta Oficial de Naturalización (Extranjero/Naturalizado)', estado: 'NO_APLICA', obs: '' },
  { id: 'colegiatura', tab: 0, categoria: 'Datos Personales', documento: 'Carnet o Solvencia de Colegio Profesional', estado: 'NO_APLICA', obs: '' },

  // Pestaña 1: Dirección
  { id: 'constancia_residencia', tab: 1, categoria: 'Dirección', documento: 'Constancia de Residencia (CNE/Comunal) o Recibo de Servicio', estado: 'PENDIENTE', obs: '' },

  // Pestaña 2: Educación e Idiomas
  { id: 'titulo_bachiller', tab: 2, categoria: 'Educación', documento: 'Título de Bachiller (Fondo negro o copia simple certificada)', estado: 'PENDIENTE', obs: '' },
  { id: 'titulo_pregrado_tsu', tab: 2, categoria: 'Educación', documento: 'Título de T.S.U. / Universitario (Fondo negro)', estado: 'NO_APLICA', obs: '' },
  { id: 'titulo_postgrado', tab: 2, categoria: 'Educación', documento: 'Título de Especialización / Maestría / Postgrado', estado: 'NO_APLICA', obs: '' },
  { id: 'constancia_estudios_act', tab: 2, categoria: 'Educación', documento: 'Constancia de Estudios Activa (Si estudia actualmente)', estado: 'NO_APLICA', obs: '' },

  // Pestaña 3: Carga Familiar y Salud
  { id: 'partidas_hijos', tab: 3, categoria: 'Carga Familiar', documento: 'Partidas de Nacimiento de Hijos', estado: 'NO_APLICA', obs: '' },
  { id: 'ci_familiares', tab: 3, categoria: 'Carga Familiar', documento: 'Copias de C.I. de Dependientes (Mayores de 9 años / Cónyuge / Padres)', estado: 'NO_APLICA', obs: '' },
  { id: 'conapdis_hijos', tab: 3, categoria: 'Carga Familiar', documento: 'Carnet CONAPDIS de Hijo(s) con Discapacidad', estado: 'NO_APLICA', obs: '' },
  { id: 'soporte_residencia_familiar', tab: 3, categoria: 'Carga Familiar', documento: 'Constancia de Residencia de familiares que no viven con él', estado: 'NO_APLICA', obs: '' },
  { id: 'conapdis_trabajador', tab: 3, categoria: 'Salud Trabajador', documento: 'Carnet CONAPDIS del Trabajador', estado: 'NO_APLICA', obs: '' },
  { id: 'informe_medico_recip', tab: 3, categoria: 'Salud Trabajador', documento: 'Informe Médico / Récipe de Tratamiento Continuo', estado: 'NO_APLICA', obs: '' },

  // Pestaña 4: Experiencia
  { id: 'constancias_trabajo_pub', tab: 4, categoria: 'Experiencia', documento: 'Constancias de Trabajo en Administración Pública', estado: 'NO_APLICA', obs: '' },
  { id: 'constancias_trabajo_priv', tab: 4, categoria: 'Experiencia', documento: 'Constancias de Trabajo en Empresa Privada', estado: 'NO_APLICA', obs: '' },
  { id: 'resolucion_jubilacion', tab: 4, categoria: 'Experiencia', documento: 'Resolución de Jubilación / Finiquito Institucional', estado: 'NO_APLICA', obs: '' },

  // Pestaña 5: HCM y Pólizas
  { id: 'planilla_fas_firmada', tab: 5, categoria: 'HCM y Pólizas', documento: 'Planilla de Afiliación FAS firmada en físico con huella dactilar', estado: 'PENDIENTE', obs: '' },
  { id: 'declaracion_salud_firmada', tab: 5, categoria: 'HCM y Pólizas', documento: 'Declaración Jurada de Salud firmada en original por el afiliado', estado: 'PENDIENTE', obs: '' },
  { id: 'soporte_embarazo', tab: 5, categoria: 'HCM y Pólizas', documento: 'Informe Médico de Control Prenatal (Si declaró embarazo)', estado: 'NO_APLICA', obs: '' },
  { id: 'poliza_concurrente', tab: 5, categoria: 'HCM y Pólizas', documento: 'Copia de Póliza Concurrente / Otro seguro de salud', estado: 'NO_APLICA', obs: '' }
];

const configurarSoportesInteligentes = (datos, revisionPreviaSoportes) => {
  if (revisionPreviaSoportes && revisionPreviaSoportes.length > 0) {
    return revisionPreviaSoportes;
  }
  const dp = datos?.datosPersonales || {};
  const ed = datos?.educacion || {};
  const fs = datos?.actividadesFamilia || {};
  const exp = datos?.experiencia || {};
  const hcm = datos?.hcmPolizas || {};
  const niveles = ed?.niveles || [];
  const dependientes = fs?.dependientes || [];
  const admPub = exp?.adminPublica || [];
  const empPriv = exp?.empresaPrivada || [];

  return initialSupports.map(item => {
    let nuevoEstado = item.estado;

    if (item.id === 'matrimonio_concubinato') {
      nuevoEstado = ['CASADO', 'CONCUBINO'].includes(dp.estadoCivil) ? 'PENDIENTE' : 'NO_APLICA';
    }
    if (item.id === 'gaceta_naturalizacion') {
      nuevoEstado = (dp.gaceta || dp.nacionalidad === 'E') ? 'PENDIENTE' : 'NO_APLICA';
    }
    if (item.id === 'colegiatura') {
      nuevoEstado = dp.colegiado === 'SÍ' ? 'PENDIENTE' : 'NO_APLICA';
    }

    if (item.id === 'titulo_pregrado_tsu') {
      const tieneTecUniv = niveles.some(n => ['TÉCNICA', 'UNIVERSITARIA'].includes(n.nivel) && n.graduado === 'SÍ');
      nuevoEstado = tieneTecUniv ? 'PENDIENTE' : 'NO_APLICA';
    }
    if (item.id === 'titulo_postgrado') {
      const tienePost = niveles.some(n => n.nivel === 'POST-GRADO' && n.graduado === 'SÍ');
      nuevoEstado = tienePost ? 'PENDIENTE' : 'NO_APLICA';
    }
    if (item.id === 'constancia_estudios_act') {
      nuevoEstado = ed.estudiaActualmente === 'SÍ' ? 'PENDIENTE' : 'NO_APLICA';
    }

    if (item.id === 'partidas_hijos') {
      const tieneHijos = dependientes.some(d => (d.parentesco || '').includes('HIJO') || (d.parentesco || '').includes('HIJA'));
      nuevoEstado = tieneHijos ? 'PENDIENTE' : 'NO_APLICA';
    }
    if (item.id === 'ci_familiares') {
      const tieneMayores = dependientes.some(d => (parseInt(d.edad) >= 9 || ['CÓNYUGE', 'PADRE', 'MADRE'].includes(d.parentesco)));
      nuevoEstado = tieneMayores ? 'PENDIENTE' : 'NO_APLICA';
    }
    if (item.id === 'conapdis_hijos') {
      const tieneHijoDisc = dependientes.some(d => (d.parentesco || '').includes('DISCAPACIDAD'));
      nuevoEstado = tieneHijoDisc ? 'PENDIENTE' : 'NO_APLICA';
    }
    if (item.id === 'soporte_residencia_familiar') {
      const tieneForaneo = dependientes.some(d => d.viveConUsted === 'NO');
      nuevoEstado = tieneForaneo ? 'PENDIENTE' : 'NO_APLICA';
    }
    if (item.id === 'conapdis_trabajador') {
      nuevoEstado = fs.discapacidadPropia === 'SÍ' ? 'PENDIENTE' : 'NO_APLICA';
    }
    if (item.id === 'informe_medico_recip') {
      nuevoEstado = fs.tomaMedicamento === 'SÍ' ? 'PENDIENTE' : 'NO_APLICA';
    }

    if (item.id === 'constancias_trabajo_pub') {
      const tienePub = admPub.some(p => p.organismo && p.organismo.trim() !== '');
      nuevoEstado = tienePub ? 'PENDIENTE' : 'NO_APLICA';
    }
    if (item.id === 'constancias_trabajo_priv') {
      const tienePriv = empPriv.some(p => p.empresa && p.empresa.trim() !== '');
      nuevoEstado = tienePriv ? 'PENDIENTE' : 'NO_APLICA';
    }
    if (item.id === 'resolucion_jubilacion') {
      nuevoEstado = (exp.esJubilado === 'SÍ' || exp.enProcesoJubilacion === 'SÍ') ? 'PENDIENTE' : 'NO_APLICA';
    }

    if (item.id === 'soporte_embarazo') {
      nuevoEstado = (dp.sexo === 'F' && hcm.estaEmbarazada === 'SÍ') ? 'PENDIENTE' : 'NO_APLICA';
    }
    if (item.id === 'poliza_concurrente') {
      nuevoEstado = hcm.tieneOtroSeguro === 'SÍ' ? 'PENDIENTE' : 'NO_APLICA';
    }

    return { ...item, estado: nuevoEstado };
  });
};

const AdminExpedientes = ({ onVolver }) => {
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('movilnet_admin_token') || '');
  const [adminUser, setAdminUser] = useState(() => sessionStorage.getItem('movilnet_admin_user') || '');
  const [loginInputUser, setLoginInputUser] = useState('');
  const [loginInputPass, setLoginInputPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [cedulaBusqueda, setCedulaBusqueda] = useState('');
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null);
  const [datosDeclarados, setDatosDeclarados] = useState(null);
  const [alertasSoportes, setAlertasSoportes] = useState([]);
  const [cargandoExpediente, setCargandoExpediente] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorBusqueda, setErrorBusqueda] = useState('');

  const [checklist, setChecklist] = useState(initialSupports);
  const [activeReviewTab, setActiveReviewTab] = useState(0);
  const [estadoGeneral, setEstadoGeneral] = useState('PENDIENTE');
  const [obsGenerales, setObsGenerales] = useState('');
  const [ipRegistrada, setIpRegistrada] = useState('');

  const tabsNombres = [
    "1. Datos Personales",
    "2. Dirección",
    "3. Educación e Idiomas",
    "4. Carga Familiar y Salud",
    "5. Experiencia",
    "6. HCM y Pólizas",
    "📋 Dictamen y Resumen Global"
  ];

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: loginInputUser, password: loginInputPass })
      });
      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem('movilnet_admin_token', data.token);
        sessionStorage.setItem('movilnet_admin_user', data.usuario);
        setAdminToken(data.token);
        setAdminUser(data.usuario);
      } else {
        const err = await response.json();
        setLoginError(err.detail || 'Credenciales administrativas no autorizadas.');
      }
    } catch (err) {
      setLoginError('Error de conexión con el servidor de seguridad.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('movilnet_admin_token');
    sessionStorage.removeItem('movilnet_admin_user');
    setAdminToken('');
    setAdminUser('');
    setTrabajadorSeleccionado(null);
    setDatosDeclarados(null);
  };

  const handleConsultarExpediente = async (e) => {
    e.preventDefault();
    if (!cedulaBusqueda.trim()) return;
    setCargandoExpediente(true);
    setErrorBusqueda('');
    setMensajeExito('');
    try {
      const response = await fetch(`/api/admin/expediente/${cedulaBusqueda.trim()}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTrabajadorSeleccionado(data.trabajador);
        setDatosDeclarados(data.datos_declarados || {});
        setAlertasSoportes(data.alertas_soportes || []);

        const soportesConfigurados = configurarSoportesInteligentes(
          data.datos_declarados, 
          data.revision_previa?.soportes
        );
        setChecklist(soportesConfigurados);
        setEstadoGeneral(data.revision_previa?.estado_general || 'PENDIENTE');
        setObsGenerales(data.revision_previa?.observaciones_generales || '');
        setIpRegistrada(data.revision_previa?.ip_revisor || '');
        setActiveReviewTab(0);
      } else if (response.status === 401) {
        handleLogout();
      } else {
        const err = await response.json();
        setErrorBusqueda(err.detail || 'El trabajador no posee datos guardados en el sistema.');
        setTrabajadorSeleccionado(null);
        setDatosDeclarados(null);
      }
    } catch (err) {
      setErrorBusqueda('Fallo de comunicación con la base de datos.');
    } finally {
      setCargandoExpediente(false);
    }
  };

  const handleEstadoChange = (id, nuevoEstado) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, estado: nuevoEstado } : item));
  };

  const handleObsChange = (id, texto) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, obs: texto.toUpperCase() } : item));
  };

  const handleGuardarAuditoria = async () => {
    setGuardando(true);
    setMensajeExito('');
    try {
      const tienePendientes = checklist.some(c => c.estado === 'PENDIENTE' || c.estado === 'ILEGIBLE');
      const estadoCalculado = tienePendientes ? (estadoGeneral === 'OBSERVADO' ? 'OBSERVADO' : 'PENDIENTE') : 'CONFORME';

      const response = await fetch('/api/admin/expediente/guardar-revision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          cedula_trabajador: trabajadorSeleccionado.cedula,
          analista_revisor: adminUser,
          estado_general: estadoCalculado,
          soportes: checklist,
          observaciones_generales: obsGenerales
        })
      });

      if (response.ok) {
        const res = await response.json();
        setMensajeExito(res.mensaje);
        setIpRegistrada(res.ip_registrada);
        setEstadoGeneral(estadoCalculado);
      } else if (response.status === 401) {
        handleLogout();
      } else {
        alert('Error al registrar la auditoría.');
      }
    } finally {
      setGuardando(false);
    }
  };

  // ================= PANTALLA DE ACCESO ADMINISTRATIVO =================
  if (!adminToken) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-300 w-full max-w-md overflow-hidden text-left">
          <div className="bg-blue-950 text-white p-6 text-center">
            <ShieldAlert size={40} className="mx-auto text-blue-400 mb-2" />
            <h1 className="text-xl font-bold uppercase tracking-wide">Acceso Restringido</h1>
            <p className="text-xs text-blue-200 mt-1">Archivo de Personal - Gestión Humana Movilnet</p>
          </div>
          <form onSubmit={handleAdminLogin} className="p-6">
            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded font-medium">
                {loginError}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">Usuario Autorizado</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Usuario de Archivo"
                  autoComplete="username"
                  className="w-full pl-10 p-2.5 border rounded text-xs font-medium uppercase outline-none focus:ring-2 focus:ring-blue-600"
                  value={loginInputUser}
                  onChange={e => setLoginInputUser(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-700 mb-1">Clave de Seguridad</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
                <input
                  type={showAdminPass ? "text" : "password"}
                  placeholder="Contraseña administrativa"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 p-2.5 border rounded text-xs font-medium outline-none focus:ring-2 focus:ring-blue-600"
                  value={loginInputPass}
                  onChange={e => setLoginInputPass(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  title={showAdminPass ? "Ocultar clave" : "Mostrar clave"}
                >
                  {showAdminPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 rounded text-xs transition-colors flex justify-center items-center gap-2"
            >
              {isLoggingIn ? 'Autenticando...' : <><Lock size={15} /> Entrar al Módulo de Archivo</>}
            </button>
            <div className="mt-4 pt-4 border-t text-center">
              <button type="button" onClick={onVolver} className="text-xs text-gray-500 hover:text-gray-800 underline">
                ← Volver al formulario del trabajador
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Cálculos de avance
  const conformes = checklist.filter(c => c.estado === 'CONFORME').length;
  const requeridos = checklist.filter(c => c.estado !== 'NO_APLICA').length;
  const pendientes = checklist.filter(c => c.estado === 'PENDIENTE').length;
  const ilegibles = checklist.filter(c => c.estado === 'ILEGIBLE').length;
  const noAplica = checklist.filter(c => c.estado === 'NO_APLICA').length;
  const porcentaje = requeridos > 0 ? Math.round((conformes / requeridos) * 100) : 0;

  // Acceso seguro a las secciones del trabajador
  const dp = datosDeclarados?.datosPersonales || {};
  const dir = datosDeclarados?.direccion || {};
  const ed = datosDeclarados?.educacion || {};
  const fs = datosDeclarados?.actividadesFamilia || {};
  const exp = datosDeclarados?.experiencia || {};
  const hcm = datosDeclarados?.hcmPolizas || {};
  const declSalud = hcm?.declaracionSalud || {};

  // Soportes de la pestaña activa
  const soportesDePestana = checklist.filter(item => item.tab === activeReviewTab);

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-5 font-sans text-left notranslate" translate="no">
      <div className="max-w-7xl mx-auto">
        <div className="bg-blue-950 text-white p-4 rounded-t-xl shadow flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="text-blue-300" /> Archivo de Personal: Revisión de Expedientes
            </h1>
            <p className="text-xs text-blue-200 mt-0.5">Validación de datos declarados por el trabajador vs. soportes en físico</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-800 hover:bg-red-700 rounded text-xs flex items-center gap-1 font-semibold transition-colors"
            >
              <LogOut size={14} /> Salir
            </button>
            {onVolver && (
              <button onClick={onVolver} className="px-3 py-1.5 bg-blue-800 hover:bg-blue-700 rounded text-xs flex items-center gap-1 font-semibold transition-colors">
                <ArrowLeft size={14} /> Menú Principal
              </button>
            )}
          </div>
        </div>

        {/* Buscador de expedientes */}
        <div className="bg-white p-4 border-x border-b shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleConsultarExpediente} className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Cédula del trabajador..."
              className="p-2 border rounded text-xs sm:text-sm w-56 outline-none uppercase font-mono font-bold focus:ring-2 focus:ring-blue-700"
              value={cedulaBusqueda}
              onChange={e => setCedulaBusqueda(e.target.value)}
            />
            <button
              type="submit"
              disabled={cargandoExpediente}
              className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-1 shadow"
            >
              <Search size={15} /> {cargandoExpediente ? 'Buscando...' : 'Consultar'}
            </button>
          </form>

          {trabajadorSeleccionado && (
            <div className="flex flex-wrap items-center gap-4 text-xs w-full md:w-auto justify-end">
              <div className="text-right">
                <span className="text-gray-500 block text-[11px]">Estatus del Expediente:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  estadoGeneral === 'CONFORME' ? 'bg-green-100 text-green-800' :
                  estadoGeneral === 'OBSERVADO' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {estadoGeneral}
                </span>
              </div>
              <div className="text-right border-l pl-3">
                <span className="text-gray-500 block text-[11px]">Conformidad Documental:</span>
                <span className="font-bold text-sm text-blue-950">{porcentaje}% ({conformes}/{requeridos})</span>
              </div>
              <div className="w-20 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                <div className={`h-full ${porcentaje === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${porcentaje}%` }}></div>
              </div>
              <button
                type="button"
                onClick={handleGuardarAuditoria}
                disabled={guardando}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1 shadow"
              >
                <Save size={14} /> {guardando ? 'Guardando...' : 'Guardar Avance'}
              </button>
            </div>
          )}
        </div>

        {errorBusqueda && (
          <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-800 text-xs rounded">
            {errorBusqueda}
          </div>
        )}

        {mensajeExito && (
          <div className="mt-4 p-3 bg-green-100 border-l-4 border-green-600 text-green-800 text-xs rounded flex items-center gap-2">
            <CheckCircle2 size={16} /> {mensajeExito} {ipRegistrada && <span>(IP Registrada: <strong>{ipRegistrada}</strong>)</span>}
          </div>
        )}

        {trabajadorSeleccionado ? (
          <div className="mt-4">
            {/* Barra de Pestañas de Revisión */}
            <div className="flex overflow-x-auto border-b border-gray-200 bg-white rounded-t-xl shadow-sm scrollbar-thin">
              {tabsNombres.map((nombre, idx) => {
                const soportesDeTab = checklist.filter(c => c.tab === idx);
                const pendTab = soportesDeTab.filter(c => c.estado === 'PENDIENTE' || c.estado === 'ILEGIBLE').length;
                const confTab = soportesDeTab.filter(c => c.estado === 'CONFORME').length;
                const reqTab = soportesDeTab.filter(c => c.estado !== 'NO_APLICA').length;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveReviewTab(idx)}
                    className={`px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 border-b-2 ${
                      activeReviewTab === idx
                        ? 'border-blue-700 text-blue-900 bg-blue-50/50'
                        : 'border-transparent text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{nombre}</span>
                    {idx < 6 && reqTab > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        pendTab > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {confTab}/{reqTab}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Contenedor de la Pestaña Activa */}
            <div className="bg-white rounded-b-xl border border-t-0 p-4 sm:p-6 shadow-sm">
              {activeReviewTab < 6 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* COLUMNA IZQUIERDA: DATOS DECLARADOS */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2 uppercase">
                        <FileText size={16} className="text-blue-700" /> Datos Actualizados en el Formulario
                      </h3>
                      <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                        Declaración del Trabajador
                      </span>
                    </div>

                    {/* VISTA 1: DATOS PERSONALES */}
                    {activeReviewTab === 0 && (
                      <div className="space-y-3 text-xs">
                        <div className="bg-gray-50 p-3 rounded-lg border grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          <div><span className="text-gray-500 block">Nombres y Apellidos:</span><span className="font-bold text-gray-800">{dp.nombres} {dp.apellidos}</span></div>
                          <div><span className="text-gray-500 block">Cédula:</span><span className="font-bold text-gray-800">{dp.cedula}</span></div>
                          <div><span className="text-gray-500 block">Nacionalidad y RIF:</span><span className="font-bold text-blue-900">{dp.nacionalidad} | {dp.rif || 'NO ASIGNADO'}</span></div>
                          <div><span className="text-gray-500 block">Fecha Nacimiento / Edad:</span><span className="font-medium">{dp.fechaNacimiento} ({dp.edad} años)</span></div>
                          <div><span className="text-gray-500 block">Sexo / Estado Civil:</span><span className="font-medium">{dp.sexo === 'F' ? 'FEMENINO' : 'MASCULINO'} | {dp.estadoCivil}</span></div>
                          <div><span className="text-gray-500 block">Lugar Nacimiento:</span><span className="font-medium">{dp.lugarNacimiento || 'NO INDICADO'}</span></div>
                          {dp.gaceta && <div className="col-span-2"><span className="text-gray-500 block">Gaceta Naturalización:</span><span className="font-bold text-blue-900">{dp.gaceta}</span></div>}
                        </div>

                        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                          <h4 className="text-[11px] font-bold text-blue-900 mb-2 uppercase">Adscripción Corporativa Movilnet</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div><span className="text-gray-500 block">Unidad de Adscripción:</span><span className="font-semibold text-gray-800">{dp.unidadAdscripcion}</span></div>
                            <div><span className="text-gray-500 block">Gerencia General:</span><span className="font-semibold text-gray-800">{dp.gerenciaGeneral}</span></div>
                            <div><span className="text-gray-500 block">Región:</span><span className="font-semibold text-gray-800">{dp.region}</span></div>
                            <div><span className="text-gray-500 block">Estado de Trabajo:</span><span className="font-semibold text-gray-800">{dp.estadoTrabajo}</span></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="border p-2.5 rounded">
                            <span className="text-gray-500 block">Profesión / Ocupación:</span>
                            <span className="font-semibold">{dp.profesion || 'N/A'} - {dp.ocupacion || 'N/A'}</span>
                            <span className="text-gray-500 block mt-1">Colegiado:</span>
                            <span className="font-semibold">{dp.colegiado === 'SÍ' ? `SÍ (N° ${dp.nroColegiado || 'S/N'})` : 'NO'}</span>
                          </div>
                          <div className="border p-2.5 rounded">
                            <span className="text-gray-500 block">Contactos de Emergencia:</span>
                            <span className="font-semibold block">1) {dp.emergenciaNombre1} ({dp.emergenciaTelefono1})</span>
                            <span className="font-semibold block">2) {dp.emergenciaNombre2} ({dp.emergenciaTelefono2})</span>
                          </div>
                        </div>

                        <div className="border p-2.5 rounded bg-gray-50">
                          <span className="text-gray-500 block mb-1">Tallas y Medidas Registradas:</span>
                          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center font-bold text-[11px]">
                            <div className="bg-white p-1 rounded border">Est: {dp.estatura || '-'}</div>
                            <div className="bg-white p-1 rounded border">Peso: {dp.peso || '-'}</div>
                            <div className="bg-white p-1 rounded border">Cam: {dp.tallaCamisa || '-'}</div>
                            <div className="bg-white p-1 rounded border">Che: {dp.tallaChemise || '-'}</div>
                            <div className="bg-white p-1 rounded border">Fra: {dp.tallaFranela || '-'}</div>
                            <div className="bg-white p-1 rounded border">Jean: {dp.tallaBluejean || '-'}</div>
                            <div className="bg-white p-1 rounded border">Bota: {dp.tallaBota || '-'}</div>
                            <div className="bg-white p-1 rounded border">Casco: {dp.tallaCasco || '-'}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VISTA 2: DIRECCIÓN */}
                    {activeReviewTab === 1 && (
                      <div className="space-y-3 text-xs">
                        <div className="bg-gray-50 p-3 rounded-lg border grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          <div><span className="text-gray-500 block">Estado:</span><span className="font-bold text-blue-900">{dir.estado}</span></div>
                          <div><span className="text-gray-500 block">Municipio:</span><span className="font-bold text-gray-800">{dir.municipio}</span></div>
                          <div><span className="text-gray-500 block">Parroquia:</span><span className="font-bold text-gray-800">{dir.parroquia}</span></div>
                          <div><span className="text-gray-500 block">Ciudad:</span><span className="font-medium">{dir.ciudad}</span></div>
                          <div className="sm:col-span-2"><span className="text-gray-500 block">Urbanización, Conjunto Residencial, Sector:</span><span className="font-medium">{dir.urbanizacion}</span></div>
                          <div className="sm:col-span-2"><span className="text-gray-500 block">Vía (Avenida/Calle/Vereda):</span><span className="font-medium">{dir.avenida}</span></div>
                          <div><span className="text-gray-500 block">Código Postal:</span><span className="font-mono font-bold text-blue-900">{dir.codigoPostal}</span></div>
                        </div>

                        <div className="border p-3 rounded-lg">
                          <h4 className="text-[11px] font-bold text-gray-700 mb-1.5 uppercase">Inmueble y Punto de Referencia</h4>
                          <p><span className="text-gray-500">Inmueble:</span> <strong>{dir.tipoInmueble} - {dir.inmueble || 'S/N'}</strong> {dir.piso && `| Piso: ${dir.piso}`} {dir.apto && `| Apto: ${dir.apto}`}</p>
                          <p className="mt-1"><span className="text-gray-500">Punto de Referencia:</span> <strong className="text-blue-950">{dir.puntoReferencia || 'NO DECLARADO'}</strong></p>
                        </div>
                      </div>
                    )}

                    {/* VISTA 3: EDUCACIÓN E IDIOMAS */}
                    {activeReviewTab === 2 && (
                      <div className="space-y-4 text-xs">
                        <div>
                          <h4 className="text-[11px] font-bold text-gray-700 mb-1 uppercase">Educación Formal Declarada</h4>
                          <table className="w-full text-left border rounded">
                            <thead className="bg-gray-100 text-gray-700">
                              <tr>
                                <th className="p-2">Nivel</th>
                                <th className="p-2 w-24">Graduado</th>
                                <th className="p-2">Título Obtenido</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(ed.niveles || []).map((n, i) => (
                                <tr key={i} className="border-t">
                                  <td className="p-2 font-medium">{n.nivel}</td>
                                  <td className="p-2 font-bold">{n.graduado === 'SÍ' ? <span className="text-green-700">SÍ</span> : 'NO'}</td>
                                  <td className="p-2">{n.titulo || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="bg-blue-50/50 p-2.5 rounded border border-blue-100">
                          <span className="text-gray-500 block">¿Estudia Actualmente?:</span>
                          <span className="font-bold">{ed.estudiaActualmente === 'SÍ' ? `SÍ (${ed.institucion || ''} - ${ed.carrera || ''} | Horario: ${ed.horario || ''})` : 'NO'}</span>
                        </div>
                      </div>
                    )}

                    {/* VISTA 4: CARGA FAMILIAR Y SALUD */}
                    {activeReviewTab === 3 && (
                      <div className="space-y-4 text-xs">
                        <div>
                          <h4 className="text-[11px] font-bold text-gray-700 mb-1 uppercase">Grupo Familiar Registrado</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border rounded min-w-[500px]">
                              <thead className="bg-gray-100 text-gray-700">
                                <tr>
                                  <th className="p-2">Familiar</th>
                                  <th className="p-2">C.I. / Edad</th>
                                  <th className="p-2">Parentesco</th>
                                  <th className="p-2">¿Vive con él?</th>
                                  <th className="p-2">Discapacidad CONAPDIS</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(fs.dependientes || []).map((d, i) => (
                                  <tr key={i} className="border-t">
                                    <td className="p-2 font-bold">{d.nombres}</td>
                                    <td className="p-2">{d.cedula || 'S/C'} ({d.edad} años)</td>
                                    <td className="p-2 font-medium">{d.parentesco}</td>
                                    <td className="p-2">{d.viveConUsted === 'NO' ? <span className="text-amber-700 font-bold">NO ({d.lugarResidencia})</span> : 'SÍ'}</td>
                                    <td className="p-2">
                                      {d.carnetConapdis ? (
                                        <span className="text-blue-900 font-bold block">
                                          N° {d.carnetConapdis} | {d.tipoDiscapacidad} ({d.grado})
                                        </span>
                                      ) : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="border p-3 rounded-lg bg-gray-50">
                          <h4 className="text-[11px] font-bold text-gray-700 mb-1 uppercase">Salud del Trabajador</h4>
                          <p><span className="text-gray-500">Discapacidad Propia:</span> <strong>{fs.discapacidadPropia === 'SÍ' ? `SÍ (N° CONAPDIS: ${fs.carnetConapdis || 'S/N'} - Tipo: ${fs.tipoDiscapacidad || '-'} - Grado: ${fs.gradoDiscapacidad || '-'})` : 'NO'}</strong></p>
                          <p className="mt-1"><span className="text-gray-500">Medicamentos continuos:</span> <strong>{fs.tomaMedicamento === 'SÍ' ? `SÍ (${fs.medicamentoCual || ''} | Motivo: ${fs.medicamentoMotivo || ''})` : 'NO'}</strong></p>
                        </div>
                      </div>
                    )}

                    {/* VISTA 5: EXPERIENCIA */}
                    {activeReviewTab === 4 && (
                      <div className="space-y-4 text-xs">
                        <div>
                          <h4 className="text-[11px] font-bold text-gray-700 mb-1 uppercase">Antecedentes en Administración Pública</h4>
                          {(exp.adminPublica || []).filter(p => p.organismo).length > 0 ? (
                            <table className="w-full text-left border rounded">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="p-2">Organismo</th>
                                  <th className="p-2">Cargo</th>
                                  <th className="p-2">Fechas</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(exp.adminPublica || []).map((p, i) => (
                                  <tr key={i} className="border-t">
                                    <td className="p-2 font-bold">{p.organismo}</td>
                                    <td className="p-2">{p.cargo}</td>
                                    <td className="p-2">{p.ingreso} a {p.egreso || 'Actual'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : <p className="text-gray-400 italic">No declaró experiencia en administración pública.</p>}
                        </div>

                        <div className="border p-2.5 rounded bg-gray-50">
                          <span className="text-gray-500 block">Jubilación:</span>
                          <span className="font-bold">{exp.esJubilado === 'SÍ' ? `Jubilado (${exp.jubiladoDesc})` : exp.enProcesoJubilacion === 'SÍ' ? `En proceso (${exp.procesoJubilacionDesc})` : 'NO'}</span>
                        </div>
                      </div>
                    )}

                    {/* VISTA 6: HCM Y PÓLIZAS */}
                    {activeReviewTab === 5 && (
                      <div className="space-y-4 text-xs">
                        <div className="bg-gray-50 p-3 rounded-lg border grid grid-cols-2 gap-2">
                          <div><span className="text-gray-500 block">¿Embarazo actual?:</span><span className="font-bold">{dp.sexo === 'F' ? (hcm.estaEmbarazada === 'SÍ' ? `SÍ (${hcm.mesesEmbarazo} meses)` : 'NO') : 'NO APLICA (MASCULINO)'}</span></div>
                          <div><span className="text-gray-500 block">Familiar en Movilnet:</span><span className="font-bold">{hcm.familiarMovilnet === 'SÍ' ? `SÍ (${hcm.familiarMovilnetParentesco})` : 'NO'}</span></div>
                          <div><span className="text-gray-500 block">Otro Seguro de Salud:</span><span className="font-bold">{hcm.tieneOtroSeguro === 'SÍ' ? 'SÍ (Póliza declarada)' : 'NO'}</span></div>
                          <div><span className="text-gray-500 block">Declaración Jurada:</span><span className="font-bold">{hcm.lugarDeclaracion || 'CARACAS'}, {hcm.fechaDeclaracion || '-'}</span></div>
                        </div>

                        <div>
                          <h4 className="text-[11px] font-bold text-gray-700 mb-1 uppercase">Beneficiarios por Fallecimiento</h4>
                          <table className="w-full text-left border rounded">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="p-2">Beneficiario</th>
                                <th className="p-2">Cédula</th>
                                <th className="p-2">Parentesco</th>
                                <th className="p-2">% Participación</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(hcm.beneficiariosFallecimiento || []).map((b, i) => (
                                <tr key={i} className="border-t">
                                  <td className="p-2 font-bold">{b.nombres}</td>
                                  <td className="p-2">{b.cedula}</td>
                                  <td className="p-2">{b.parentesco}</td>
                                  <td className="p-2 font-bold text-blue-900">{b.porcentaje}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="border p-2.5 rounded bg-blue-50/40">
                          <h4 className="text-[11px] font-bold text-blue-950 mb-1 uppercase">Declaración de Salud Respondida (15 Puntos)</h4>
                          <div className="grid grid-cols-5 sm:grid-cols-8 gap-1 text-center font-bold text-[11px]">
                            {['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11','p12','p13','p14','p15'].map((p, idx) => (
                              <div key={p} className={`p-1 rounded border ${declSalud[p] === 'SÍ' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-white'}`}>
                                #{idx+1}: {declSalud[p] || 'NO'}
                              </div>
                            ))}
                          </div>
                          {declSalud.detallesEnfermedades && (
                            <p className="mt-2 text-xs text-red-800 font-medium"><strong>Observaciones de salud:</strong> {declSalud.detallesEnfermedades}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* COLUMNA DERECHA: SOPORTES REQUERIDOS PARA ESTA PESTAÑA */}
                  <div className="lg:col-span-5 border-l pl-0 lg:pl-6 space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="text-sm font-bold text-gray-800 uppercase flex items-center gap-1.5">
                        <CheckSquare size={16} className="text-blue-700" /> Soportes a Verificar en Expediente
                      </h3>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {soportesDePestana.length} recaudos
                      </span>
                    </div>

                    <div className="space-y-3">
                      {soportesDePestana.map(item => (
                        <div key={item.id} className="p-3 rounded-lg border bg-gray-50 hover:bg-white transition-colors">
                          <span className="font-bold text-xs text-gray-800 block mb-1.5">{item.documento}</span>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <select
                              value={item.estado}
                              onChange={e => handleEstadoChange(item.id, e.target.value)}
                              className={`p-1.5 rounded border text-[11px] font-bold uppercase outline-none ${
                                item.estado === 'CONFORME' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                item.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                item.estado === 'ILEGIBLE' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                                'bg-gray-100 text-gray-600 border-gray-300'
                              }`}
                            >
                              <option value="CONFORME">✓ CONFORME</option>
                              <option value="PENDIENTE">⏳ PENDIENTE</option>
                              <option value="ILEGIBLE">⚠️ ILEGIBLE / VENCIDO</option>
                              <option value="NO_APLICA">✖ NO APLICA</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Observación o Folio..."
                              value={item.obs}
                              onChange={e => handleObsChange(item.id, e.target.value)}
                              className="p-1.5 border rounded text-[11px] uppercase outline-none focus:ring-1 focus:ring-blue-600"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Navegación entre pestañas */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <button
                        type="button"
                        disabled={activeReviewTab === 0}
                        onClick={() => setActiveReviewTab(prev => prev - 1)}
                        className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-semibold flex items-center gap-1 disabled:opacity-40"
                      >
                        <ChevronLeft size={14} /> Pestaña Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveReviewTab(prev => prev + 1)}
                        className="px-3 py-1.5 text-xs text-blue-900 bg-blue-100 hover:bg-blue-200 rounded font-bold flex items-center gap-1"
                      >
                        Siguiente Pestaña <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* PESTAÑA 7: RESUMEN Y DICTAMEN GLOBAL */
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                      <span className="text-gray-500 block text-[11px]">Conformes</span>
                      <strong className="text-emerald-700 text-lg">{conformes}</strong>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                      <span className="text-gray-500 block text-[11px]">Pendientes</span>
                      <strong className="text-amber-700 text-lg">{pendientes}</strong>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg">
                      <span className="text-gray-500 block text-[11px]">Ilegibles / Vencidos</span>
                      <strong className="text-rose-700 text-lg">{ilegibles}</strong>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                      <span className="text-gray-500 block text-[11px]">No Aplica</span>
                      <strong className="text-gray-600 text-lg">{noAplica}</strong>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-800 mb-2 uppercase flex items-center gap-1.5">
                      <AlertCircle size={15} className="text-amber-600" /> Soportes Pendientes o con Observaciones por Solicitar:
                    </h4>
                    {checklist.filter(c => c.estado === 'PENDIENTE' || c.estado === 'ILEGIBLE').length > 0 ? (
                      <div className="border rounded-lg divide-y bg-white">
                        {checklist.filter(c => c.estado === 'PENDIENTE' || c.estado === 'ILEGIBLE').map(item => (
                          <div key={item.id} className="p-2.5 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-gray-800 block">{item.documento}</span>
                              <span className="text-[11px] text-gray-500">Pestaña: {item.categoria}</span>
                              {item.obs && <span className="text-[11px] text-red-700 block font-medium">Nota: {item.obs}</span>}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {item.estado}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-bold flex items-center gap-2">
                        <CheckCircle2 size={18} /> ¡Excelente! Todos los soportes requeridos para este trabajador se encuentran conformes.
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <label className="font-bold text-gray-800 text-xs uppercase">Estatus Final del Expediente Físico:</label>
                      <select
                        value={estadoGeneral}
                        onChange={e => setEstadoGeneral(e.target.value)}
                        className={`p-1.5 border rounded text-xs font-bold uppercase ${
                          estadoGeneral === 'CONFORME' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          estadoGeneral === 'OBSERVADO' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                          'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="CONFORME">CONFORME (EXPEDIENTE COMPLETO)</option>
                        <option value="PENDIENTE">PENDIENTE (FALTAN RECAUDOS)</option>
                        <option value="OBSERVADO">OBSERVADO (DOCUMENTOS NO COINCIDEN)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 text-xs font-bold mb-1">Dictamen u Observaciones Generales del Archivo de RRHH:</label>
                      <textarea
                        rows="3"
                        value={obsGenerales}
                        onChange={e => setObsGenerales(e.target.value.toUpperCase())}
                        placeholder="Ej. Expediente auditado en físico. Se deja constancia de recaudos conformes según actualización de fecha..."
                        className="w-full p-2 border rounded text-xs uppercase outline-none focus:ring-1 focus:ring-blue-700 bg-white"
                      ></textarea>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleGuardarAuditoria}
                      disabled={guardando}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 shadow-md transition-colors"
                    >
                      <Save size={16} /> {guardando ? 'Guardando Dictamen en Base de Datos...' : 'Registrar Dictamen de Auditoría en Expediente'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8 text-center text-gray-400 py-16 bg-white rounded-xl border border-dashed">
            <FileText size={48} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-600">Módulo de Verificación Documental (Archivo de Personal)</p>
            <p className="text-xs text-gray-400 mt-1">Ingrese la cédula de identidad del trabajador arriba para contrastar los datos declarados contra su carpeta física.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminExpedientes;