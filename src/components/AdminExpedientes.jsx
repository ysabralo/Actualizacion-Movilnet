import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, XCircle, AlertTriangle, FileText, Save, ArrowLeft, ShieldCheck, User, Lock, LogOut, ShieldAlert } from 'lucide-react';

const AdminExpedientes = ({ onVolver }) => {
  // Autenticación Administrativa
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('movilnet_admin_token') || '');
  const [adminUser, setAdminUser] = useState(() => sessionStorage.getItem('movilnet_admin_user') || '');
  const [loginInputUser, setLoginInputUser] = useState('');
  const [loginInputPass, setLoginInputPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Consulta y Auditoría
  const [cedulaBusqueda, setCedulaBusqueda] = useState('');
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null);
  const [alertasSoportes, setAlertasSoportes] = useState([]);
  const [cargandoExpediente, setCargandoExpediente] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorBusqueda, setErrorBusqueda] = useState('');

  const [checklist, setChecklist] = useState([
    { id: 'ci', categoria: 'Identificación', documento: 'Cédula de Identidad Vigente y Legible', estado: 'PENDIENTE', obs: '' },
    { id: 'rif', categoria: 'Identificación', documento: 'Comprobante RIF Actualizado', estado: 'PENDIENTE', obs: '' },
    { id: 'partida_nac', categoria: 'Identificación', documento: 'Partida de Nacimiento del Trabajador', estado: 'PENDIENTE', obs: '' },
    { id: 'residencia', categoria: 'Dirección', documento: 'Carta de Residencia o Recibo de Servicio', estado: 'PENDIENTE', obs: '' },
    { id: 'titulos', categoria: 'Educación', documento: 'Títulos Académicos Declarados (Fondo Negro / Simple)', estado: 'PENDIENTE', obs: '' },
    { id: 'conapdis_trab', categoria: 'Salud', documento: 'Carnet CONAPDIS Trabajador (Si aplica)', estado: 'NO_APLICA', obs: '' },
    { id: 'carga_familiar', categoria: 'Carga Familiar', documento: 'Partidas de Nacimiento / C.I. Dependientes', estado: 'PENDIENTE', obs: '' },
    { id: 'conapdis_hijos', categoria: 'Carga Familiar', documento: 'Carnet CONAPDIS Hijos con Discapacidad (Si aplica)', estado: 'NO_APLICA', obs: '' },
    { id: 'constancias_trabajo', categoria: 'Experiencia', documento: 'Constancias de Trabajo Previas / Jubilación', estado: 'PENDIENTE', obs: '' },
    { id: 'planilla_fas', categoria: 'FAS / HCM', documento: 'Planilla de Afiliación FAS Firmada con Huella', estado: 'PENDIENTE', obs: '' }
  ]);

  const [obsGenerales, setObsGenerales] = useState('');
  const [ipRegistrada, setIpRegistrada] = useState('');

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
        setAlertasSoportes(data.alertas_soportes || []);

        if (data.revision_previa && data.revision_previa.soportes?.length > 0) {
          setChecklist(data.revision_previa.soportes);
          setObsGenerales(data.revision_previa.observaciones_generales || '');
          setIpRegistrada(data.revision_previa.ip_revisor || '');
        } else {
          // Preconfigurar banderas según datos declarados
          setChecklist(prev => prev.map(item => {
            if (item.id === 'conapdis_trab' && data.datos_declarados?.actividadesFamilia?.discapacidadPropia === 'SÍ') {
              return { ...item, estado: 'PENDIENTE' };
            }
            if (item.id === 'conapdis_hijos') {
              const deps = data.datos_declarados?.actividadesFamilia?.dependientes || [];
              const tieneHijoDisc = deps.some(d => (d.parentesco || '').includes('DISCAPACIDAD'));
              return { ...item, estado: tieneHijoDisc ? 'PENDIENTE' : 'NO_APLICA' };
            }
            return item;
          }));
        }
      } else if (response.status === 401) {
        handleLogout();
      } else {
        const err = await response.json();
        setErrorBusqueda(err.detail || 'Trabajador no encontrado en el sistema.');
        setTrabajadorSeleccionado(null);
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
      const estadoGeneral = tienePendientes ? 'PENDIENTE' : 'CONFORME';

      const response = await fetch('/api/admin/expediente/guardar-revision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          cedula_trabajador: trabajadorSeleccionado.cedula,
          analista_revisor: adminUser,
          estado_general: estadoGeneral,
          soportes: checklist,
          observaciones_generales: obsGenerales
        })
      });

      if (response.ok) {
        const res = await response.json();
        setMensajeExito(res.mensaje);
        setIpRegistrada(res.ip_registrada);
      } else if (response.status === 401) {
        handleLogout();
      } else {
        alert('Error al registrar la auditoría.');
      }
    } finally {
      setGuardando(false);
    }
  };

  // ================= PANTALLA DE ACCESO ADMINISTRATIVO (BLOQUEO) =================
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
                <User size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Usuario de Archivo"
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
                <Lock size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="password"
                  placeholder="Contraseña administrativa"
                  className="w-full pl-10 p-2.5 border rounded text-xs font-medium outline-none focus:ring-2 focus:ring-blue-600"
                  value={loginInputPass}
                  onChange={e => setLoginInputPass(e.target.value)}
                  required
                />
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
  const porcentaje = requeridos > 0 ? Math.round((conformes / requeridos) * 100) : 0;

  // ================= PANTALLA PRINCIPAL AUDITORÍA DE SOPORTES =================
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 font-sans text-left notranslate" translate="no">
      <div className="max-w-7xl mx-auto">
        <div className="bg-blue-950 text-white p-4 sm:p-5 rounded-t-xl shadow flex justify-between items-center">
          <div>
            <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="text-blue-300" /> Archivo de Personal: Control de Soportes
            </h1>
            <p className="text-xs text-blue-200 mt-0.5">Auditoría física y trazabilidad de expedientes laborales</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-blue-200 block">Auditor activo: <strong>{adminUser.toUpperCase()}</strong></span>
              {ipRegistrada && <span className="text-[10px] text-blue-300">IP Sesión: {ipRegistrada}</span>}
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión de archivo"
              className="px-3 py-1.5 bg-red-800 hover:bg-red-700 rounded text-xs flex items-center gap-1 font-semibold"
            >
              <LogOut size={14} /> Salir
            </button>
            {onVolver && (
              <button onClick={onVolver} className="px-3 py-1.5 bg-blue-800 hover:bg-blue-700 rounded text-xs flex items-center gap-1 font-semibold">
                <ArrowLeft size={14} /> Menú Principal
              </button>
            )}
          </div>
        </div>

        {/* Buscador de expedientes */}
        <div className="bg-white p-4 border-x border-b shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleConsultarExpediente} className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Cédula del trabajador..."
              className="p-2 border rounded text-xs sm:text-sm w-60 outline-none uppercase font-mono font-bold"
              value={cedulaBusqueda}
              onChange={e => setCedulaBusqueda(e.target.value)}
            />
            <button
              type="submit"
              disabled={cargandoExpediente}
              className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-1"
            >
              <Search size={15} /> {cargandoExpediente ? 'Buscando...' : 'Buscar Expediente'}
            </button>
          </form>

          {trabajadorSeleccionado && (
            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-gray-500 block">Conformidad Documental:</span>
                <span className="font-bold text-sm text-blue-950">{porcentaje}% ({conformes}/{requeridos} soportes)</span>
              </div>
              <div className="w-24 bg-gray-200 h-3 rounded-full overflow-hidden">
                <div className={`h-full ${porcentaje === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${porcentaje}%` }}></div>
              </div>
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
            <CheckCircle2 size={16} /> {mensajeExito} (IP Trazabilidad: <strong>{ipRegistrada}</strong>)
          </div>
        )}

        {trabajadorSeleccionado ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Ficha Resumen */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <h2 className="text-sm font-bold text-gray-800 border-b pb-2 mb-3 flex items-center gap-2">
                  <User size={16} className="text-blue-800" /> Ficha del Trabajador
                </h2>
                <div className="space-y-2 text-xs">
                  <div><span className="text-gray-500 block">Trabajador:</span><span className="font-bold uppercase text-gray-800">{trabajadorSeleccionado.nombres} {trabajadorSeleccionado.apellidos}</span></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-gray-500 block">Cédula:</span><span className="font-semibold">{trabajadorSeleccionado.cedula}</span></div>
                    <div><span className="text-gray-500 block">N° Personal (P00):</span><span className="font-semibold">{trabajadorSeleccionado.p00}</span></div>
                  </div>
                  <div><span className="text-gray-500 block">Unidad de Adscripción:</span><span className="font-medium text-gray-700">{trabajadorSeleccionado.unidadAdscripcion || 'NO REGISTRADA'}</span></div>
                  <div><span className="text-gray-500 block">Gerencia General:</span><span className="font-medium text-gray-700">{trabajadorSeleccionado.gerenciaGeneral || 'NO REGISTRADA'}</span></div>
                  <div><span className="text-gray-500 block">Ubicación de Trabajo:</span><span className="font-medium text-gray-700">{trabajadorSeleccionado.estadoTrabajo || 'NO REGISTRADA'}</span></div>
                </div>

                {alertasSoportes.length > 0 && (
                  <div className="mt-4 pt-3 border-t">
                    <h3 className="text-xs font-bold text-gray-700 uppercase mb-2">Soportes Especiales Requeridos:</h3>
                    <div className="space-y-1.5 text-[11px]">
                      {alertasSoportes.map((alerta, i) => (
                        <div key={i} className="p-2 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 flex items-center justify-between">
                          <span>{alerta}</span>
                          <AlertTriangle size={14} className="text-yellow-600 flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Checklist de Documentos */}
            <div className="lg:col-span-8 bg-white p-5 rounded-xl border shadow-sm">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h2 className="text-sm font-bold text-gray-800 uppercase flex items-center gap-2">
                  <FileText size={16} className="text-blue-800" /> Soportes Físicos en Expediente
                </h2>
                <span className="text-[11px] text-gray-500">Auditoría con firma digital de IP</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border rounded-lg">
                  <thead className="bg-gray-100 text-gray-700 border-b">
                    <tr>
                      <th className="p-2.5 w-1/3">Documento</th>
                      <th className="p-2.5 w-36">Estatus</th>
                      <th className="p-2.5">Observaciones de Archivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checklist.map(item => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium text-gray-800">
                          {item.documento}
                          <span className="block text-[10px] text-gray-400 font-normal">{item.categoria}</span>
                        </td>
                        <td className="p-2">
                          <select
                            value={item.estado}
                            onChange={e => handleEstadoChange(item.id, e.target.value)}
                            className={`p-1.5 rounded border text-xs font-bold w-full uppercase ${
                              item.estado === 'CONFORME' ? 'bg-green-100 text-green-800 border-green-300' :
                              item.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              item.estado === 'ILEGIBLE' ? 'bg-red-100 text-red-800 border-red-300' :
                              'bg-gray-100 text-gray-600 border-gray-300'
                            }`}
                          >
                            <option value="CONFORME">CONFORME</option>
                            <option value="PENDIENTE">PENDIENTE</option>
                            <option value="ILEGIBLE">ILEGIBLE / VENCIDO</option>
                            <option value="NO_APLICA">NO APLICA</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Detalle o nota..."
                            value={item.obs}
                            onChange={e => handleObsChange(item.id, e.target.value)}
                            className="w-full p-1.5 border rounded text-xs uppercase"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">Dictamen General del Expediente:</label>
                <textarea
                  rows="2"
                  value={obsGenerales}
                  onChange={e => setObsGenerales(e.target.value.toUpperCase())}
                  placeholder="Detalles sobre solvencia documental en físico..."
                  className="w-full p-2 border rounded text-xs uppercase"
                ></textarea>
              </div>

              <div className="mt-5 pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleGuardarAuditoria}
                  disabled={guardando}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Save size={16} /> {guardando ? 'Firmando y Guardando...' : 'Registrar Dictamen de Archivo'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-12 text-center text-gray-400 py-16 bg-white rounded-xl border border-dashed">
            <FileText size={48} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold">Consulte una cédula de identidad para auditar los soportes físicos del expediente</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminExpedientes;