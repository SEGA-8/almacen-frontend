import "./App.css";
import React, { useState, useEffect, useCallback } from "react";
import {
  Download,
  Edit2,
  Eye,
  FileDown,
  LogOut,
  Mail,
  Plus,
  Printer,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";

const API_URL = "http://192.168.1.22:5000/api";

export default function WarehouseDB() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loginData, setLoginData] = useState({ usuario: "", password: "" });
  const [registerData, setRegisterData] = useState({
    usuario: "",
    password: "",
    email: "",
    confirmPassword: "",
  });
  const [showRegister, setShowRegister] = useState(false);
  const [entradas, setEntradas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [transportistas, setTransportistas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [view, setView] = useState(token ? "list" : "login");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [numberOfEntries, setNumberOfEntries] = useState(
    parseInt(localStorage.getItem("numberOfEntries")) || 2,
  );
  const [loading, setLoading] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    codigo: "",
    descripcion: "",
  });
  const [dateFilter, setDateFilter] = useState({
    fechaInicio: "",
    fechaFin: "",
  });
  const [editingClientId, setEditingClientId] = useState(null);
  const [clientForm, setClientForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
  });
  const [editingCarrierId, setEditingCarrierId] = useState(null);
  const [carrierForm, setCarrierForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    empresa: "",
  });
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [formData, setFormData] = useState({
    numero_entrada: "",
    fecha_entrada: new Date().toISOString().split("T")[0],
    id_cliente: "",
    id_transportista: "",
    estado: "Reparación",
    numero_bultos: "",
    observaciones: "",
    lineas: [],
  });

  const [lineaActual, setLineaActual] = useState({
    id_producto: "",
    codigo: "",
    descripcion: "",
    rma: "",
    serie: "",
    cantidad: "",
  });

  const [reportFilters, setReportFilters] = useState({
    fechaInicio: "",
    fechaFin: "",
    cliente: "",
    transportista: "",
  });

  // Estados para el modal de email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    destinatario: "",
    asunto: "",
    mensaje: "",
  });
  const [sendingEmail, setSendingEmail] = useState(false);

  // GESTIÓN DE DATOS
  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [entResult, clResult, trResult, arResult] = await Promise.all([
        fetch(`${API_URL}/entradas/${numberOfEntries}`, { headers }).then((r) =>
          r.json(),
        ),
        fetch(`${API_URL}/clientes`, { headers }).then((r) => r.json()),
        fetch(`${API_URL}/transportistas`, { headers }).then((r) => r.json()),
        fetch(`${API_URL}/productos`, { headers }).then((r) => r.json()),
      ]);
      setEntradas(entResult);
      setClientes(clResult);
      setTransportistas(trResult);
      setProductos(arResult);
    } catch (err) {
      alert("Error al cargar datos: " + err.message);
    } finally {
      console.log("Datos cargados:", {
        entradas,
        clientes,
        transportistas,
        productos,
      });
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // GESTIÓN DE LOGIN Y REGISTRO DE USUARIOS
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setView("list");
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Error de conexión: " + err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    if (registerData.password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (!registerData.usuario || !registerData.email) {
      alert("Por favor completa todos los campos");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: registerData.usuario,
          password: registerData.password,
          email: registerData.email,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Usuario registrado exitosamente. Ahora puedes iniciar sesión.");
        setShowRegister(false);
        setRegisterData({
          usuario: "",
          password: "",
          email: "",
          confirmPassword: "",
        });
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Error de conexión: " + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setView("login");
  };

  const addLinea = () => {
    if (!lineaActual.id_producto || !lineaActual.cantidad) {
      alert("Completa los campos obligatorios de la línea");
      return;
    }

    const producto = productos.find(
      (p) => p.ProductoID === parseInt(lineaActual.id_producto),
    );

    const nuevaLinea = {
      ...lineaActual,
      codigo: producto.Codigo,
      temp_id: Date.now(),
    };

    setFormData({
      ...formData,
      lineas: [...formData.lineas, nuevaLinea],
    });

    setLineaActual({
      id_producto: "",
      codigo: "",
      descripcion: "",
      rma: "",
      serie: "",
      cantidad: "",
    });
  };

  const removeLinea = (temp_id) => {
    setFormData({
      ...formData,
      lineas: formData.lineas.filter((l) => l.temp_id !== temp_id),
    });
  };

  const handleAddEntry = async () => {
    if (!formData.numero_entrada || !formData.id_cliente) {
      alert("Completa el número de entrada y selecciona un cliente");
      return;
    }

    if (formData.lineas.length === 0) {
      alert("Debes agregar al menos una línea de artículo");
      return;
    }
    setLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const url = editingId
        ? `${API_URL}/entradas/${editingId}`
        : `${API_URL}/entradas`;
      const method = editingId ? "PUT" : "POST";

      const dataToSend = {
        ...formData,
        lineas: formData.lineas.map((l) => ({
          id_producto: parseInt(l.id_producto),
          codigo: l.codigo,
          descripcion: l.descripcion,
          rma: l.rma,
          serie: l.serie,
          cantidad: parseInt(l.cantidad),
        })),
      };

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        await loadData();
        resetForm();
        setView("list");
        alert(editingId ? "Entrada actualizada" : "Entrada creada");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      numero_entrada:
        filteredEntradas.length > 0
          ? `ENT-${String(Math.max(...filteredEntradas.map((e) => parseInt(e.NumeroEntrada.split("-")[1] || 0))) + 1).padStart(5, "0")}`
          : "ENT-00001",
      fecha_entrada: new Date().toISOString().split("T")[0],
      id_cliente: "",
      id_transportista: "",
      estado: "Reparación",
      numero_bultos: "",
      observaciones: "",
      lineas: [],
    });
    setLineaActual({
      id_producto: "",
      descripcion: "",
      rma: "",
      serie: "",
      cantidad: "",
    });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro?")) return;

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(`${API_URL}/entradas/${id}`, {
        method: "DELETE",
        headers,
      });
      if (response.ok) {
        await loadData();
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(`${API_URL}/entrada/${id}`, { headers });
      const data = await response.json();

      console.log("Datos cargados de entrada:", {
        entrada: data.entrada,
        lineas: data.lineas,
      });
      setFormData({
        numero_entrada: data.entrada.NumeroEntrada,
        fecha_entrada: data.entrada.FechaEntrada.split("T")[0],
        id_cliente: data.entrada.ClienteID || "",
        id_transportista: data.entrada.TransportistaID || "",
        estado: data.entrada.Estado || "Reparación",
        numero_bultos: data.entrada.NumeroBultos || 0,
        observaciones: data.entrada.Observaciones || "",
        lineas: data.lineas.map((l) => ({
          id_producto: l.ProductoID,
          codigo: l.Codigo || "",
          descripcion: l.Descripcion || "",
          rma: l.NumeroRMA || "",
          serie: l.NumeroSerie || "",
          cantidad: l.Cantidad || 1,
          temp_id: l.LineaID, // Usamos LineaID como temp_id para edición
        })),
      });
      setEditingId(id);
      setView("form");
    } catch (err) {
      alert("Errores: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // GESTIÓN DE PRODUCTOS
  const handleAddProduct = async () => {
    if (!productForm.codigo) {
      alert("El codigo del producto es obligatorio");
      return;
    }

    setLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const url = editingProductId
        ? `${API_URL}/productos/${editingProductId}`
        : `${API_URL}/productos`;
      const method = editingProductId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(productForm),
      });

      if (response.ok) {
        await loadData();
        setProductForm({ codigo: "", descripcion: "" });
        setEditingProductId(null);
        alert(editingProductId ? "Producto actualizado" : "Producto creado");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setProductForm({
      codigo: product.Codigo,
      descripcion: product.Descripcion || "",
    });
    setEditingProductId(product.ProductoID);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(`${API_URL}/productos/${id}`, {
        method: "DELETE",
        headers,
      });
      if (response.ok) {
        await loadData();
        alert("Producto eliminado");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // GESTIÓN DE CLIENTES
  const handleAddClient = async () => {
    if (!clientForm.nombre) {
      alert("El nombre del cliente es obligatorio");
      return;
    }

    setLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const url = editingClientId
        ? `${API_URL}/clientes/${editingClientId}`
        : `${API_URL}/clientes`;
      const method = editingClientId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(clientForm),
      });

      if (response.ok) {
        await loadData();
        setClientForm({ nombre: "", email: "", telefono: "", direccion: "" });
        setEditingClientId(null);
        alert(editingClientId ? "Cliente actualizado" : "Cliente creado");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClient = (client) => {
    setClientForm({
      nombre: client.Nombre,
      email: client.Email || "",
      telefono: client.Telefono || "",
      direccion: client.Direccion || "",
    });
    setEditingClientId(client.ClienteID);
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este cliente?")) return;

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(`${API_URL}/clientes/${id}`, {
        method: "DELETE",
        headers,
      });
      if (response.ok) {
        await loadData();
        alert("Cliente eliminado");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // GESTIÓN DE TRANSPORTISTAS
  const handleAddCarrier = async () => {
    if (!carrierForm.nombre) {
      alert("El nombre del transportista es obligatorio");
      return;
    }

    setLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const url = editingCarrierId
        ? `${API_URL}/transportistas/${editingCarrierId}`
        : `${API_URL}/transportistas`;
      const method = editingCarrierId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(carrierForm),
      });

      if (response.ok) {
        await loadData();
        setCarrierForm({ nombre: "", email: "", telefono: "", empresa: "" });
        setEditingCarrierId(null);
        alert(
          editingCarrierId
            ? "Transportista actualizado"
            : "Transportista creado",
        );
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCarrier = (carrier) => {
    setCarrierForm({
      nombre: carrier.Nombre,
      email: carrier.Email || "",
      telefono: carrier.Telefono || "",
      empresa: carrier.Empresa || "",
    });
    setEditingCarrierId(carrier.TransportistaID);
  };

  const handleDeleteCarrier = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este transportista?"))
      return;

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(`${API_URL}/transportistas/${id}`, {
        method: "DELETE",
        headers,
      });
      if (response.ok) {
        await loadData();
        alert("Transportista eliminado");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // GESTIÓN DE VISTAS
  const handleViewDetails = async (Entryid) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(`${API_URL}/entrada/${Entryid}`, {
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedEntry(data);
        setShowDetails(true);
      }
    } catch (err) {
      alert("Error al cargar detalles: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!Array.isArray(entradas)) {
    console.error("Expected entradas to be an array but got:", entradas);
    return null;
  }
  if (!Array.isArray(entradas)) {
    console.error("Backend returned an error:", entradas.error);
    return [];
  }

  const filteredEntradas = entradas.filter((entry) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      entry.NumeroEntrada.toLowerCase().includes(searchLower) ||
      entry.Cliente.toLowerCase().includes(searchLower) ||
      (entry.Transportista &&
        entry.Transportista.toLowerCase().includes(searchLower));

    const matchesFilter = filterType === "all" || entry.Estado === filterType;

    let matchesDate = true;
    if (dateFilter.fechaInicio && dateFilter.fechaFin) {
      const entryDate = entry.FechaEntrada.split("T")[0];
      matchesDate =
        entryDate >= dateFilter.fechaInicio && entryDate <= dateFilter.fechaFin;
    }

    return matchesSearch && matchesFilter && matchesDate;
  });

  const getEntradasByDate = () => {
    const grouped = {};
    filteredEntradas.forEach((entry) => {
      const fecha = entry.FechaEntrada.split("T")[0];
      if (!grouped[fecha]) {
        grouped[fecha] = [];
      }
      grouped[fecha].push(entry);
    });
    return Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .map((fecha) => ({
        fecha,
        entradas: grouped[fecha],
      }));
  };

  const EntradasByDate = getEntradasByDate();

  const totalUnidadesGlobal = formData.lineas.reduce(
    (sum, l) => sum + parseInt(l.Cantidad || 0),
    0,
  );

  // GESTION DE INFORMES
  const generateReport = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(`${API_URL}/informes/detallado`, {
        headers,
      });
      const EntradasReport = await response.json();

      let filtered = EntradasReport;

      if (reportFilters.fechaInicio) {
        filtered = filtered.filter(
          (e) => e.fecha_entrada >= reportFilters.fechaInicio,
        );
      }
      if (reportFilters.fechaFin) {
        filtered = filtered.filter(
          (e) => e.fecha_entrada <= reportFilters.fechaFin,
        );
      }
      if (reportFilters.cliente) {
        filtered = filtered.filter((e) =>
          e.cliente.toLowerCase().includes(reportFilters.cliente.toLowerCase()),
        );
      }
      if (reportFilters.transportista) {
        filtered = filtered.filter((e) =>
          e.transportista
            .toLowerCase()
            .includes(reportFilters.transportista.toLowerCase()),
        );
      }

      const totalEntradas = filtered.length;
      const totalBultos = filtered.reduce(
        (sum, e) => sum + parseInt(e.NumeroBultos || 0),
        0,
      );

      let csv = "INFORME DE ENTRADAS DE ALMACÉN\n";
      csv += `Generado: ${new Date().toLocaleDateString()}\n\n`;
      csv += "RESUMEN\n";
      csv += `Total de Entradas,${totalEntradas}\n`;
      csv += `Total de Bultos,${totalBultos}\n`;
      csv += "DETALLE DE ENTRADAS\n";
      csv +=
        "Fecha,Nº Entrada,Cliente,Transportista,Artículo,NumeroBultos,Estado,Descripción\n";

      filtered.forEach((e) => {
        csv += `${e.FechaEntrada.split("T")[0]},"${e.NumeroEntrada}","${e.Cliente}","${e.Transportista || ""}","${e.Codigo || ""}",${e.NumeroBultos},"${e.Estado}","${e.Descripcion || ""}"\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `Informe_Almacen_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.click();
    } catch (err) {
      alert("Error al generar informe: " + err.message);
    }
  };

  // ==================== FUNCIONES DE PDF ====================

  // Descargar PDF desde el servidor
  const handleDownloadPDF = async () => {
    if (!selectedEntry) return;

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(
        `${API_URL}/entradas/${selectedEntry.entrada.EntradaID}/pdf`,
        { headers },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Entrada_${selectedEntry.entrada.NumeroEntrada}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error("Error al generar PDF");
      }
    } catch (err) {
      alert("Error al descargar PDF: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Imprimir PDF (abre en nueva ventana)
  const handlePrintPDF = async () => {
    if (!selectedEntry) return;

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(
        `${API_URL}/entradas/${selectedEntry.entrada.EntradaID}/pdf`,
        { headers },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const printWindow = window.open(url, "_blank");
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        throw new Error("Error al generar PDF");
      }
    } catch (err) {
      alert("Error al imprimir: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de email
  const handleOpenEmailModal = () => {
    if (!selectedEntry) return;

    // Pre-rellenar con el email del cliente si existe
    setEmailForm({
      destinatario: selectedEntry.entrada.cliente_email || "",
      asunto: `Entrada de Almacén - ${selectedEntry.entrada.NumeroEntrada}`,
      mensaje: `Adjunto le enviamos el documento de la entrada ${selectedEntry.entrada.NumeroEntrada} correspondiente a la fecha ${new Date(selectedEntry.entrada.FechaEntrada).toLocaleDateString("es-ES")}.`,
    });
    setShowEmailModal(true);
  };

  // Enviar email con PDF
  const handleSendEmail = async () => {
    if (!emailForm.destinatario) {
      alert("El destinatario es obligatorio");
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailForm.destinatario)) {
      alert("Por favor introduce un email válido");
      return;
    }

    setSendingEmail(true);
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await fetch(
        `${API_URL}/entradas/${selectedEntry.entrada.EntradaID}/email`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(emailForm),
        },
      );

      const data = await response.json();

      if (response.ok) {
        alert(`Email enviado exitosamente a ${emailForm.destinatario}`);
        setShowEmailModal(false);
        setEmailForm({ destinatario: "", asunto: "", mensaje: "" });
      } else {
        throw new Error(data.error || "Error al enviar email");
      }
    } catch (err) {
      alert("Error al enviar email: " + err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Gestión de Almacén
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Sistema de control de entradas
          </p>

          {!showRegister ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Iniciar Sesión
              </h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="text"
                  placeholder="Usuario"
                  value={loginData.usuario}
                  onChange={(e) =>
                    setLoginData({ ...loginData, usuario: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-all"
                >
                  Iniciar Sesión
                </button>
              </form>
              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">¿No tienes cuenta?</p>
                <button
                  onClick={() => setShowRegister(true)}
                  className="text-indigo-600 font-semibold hover:text-indigo-800 mt-2"
                >
                  Registrate aquí
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Crear Nueva Cuenta
              </h2>
              <form onSubmit={handleRegister} className="space-y-4">
                <input
                  type="text"
                  placeholder="Usuario"
                  value={registerData.usuario}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      usuario: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, email: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="password"
                  placeholder="Contraseña (mínimo 6 caracteres)"
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      password: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="password"
                  placeholder="Confirmar Contraseña"
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-all"
                >
                  Crear Cuenta
                </button>
              </form>
              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">¿Ya tienes cuenta?</p>
                <button
                  onClick={() => {
                    setShowRegister(false);
                    setRegisterData({
                      usuario: "",
                      password: "",
                      email: "",
                      confirmPassword: "",
                    });
                  }}
                  className="text-indigo-600 font-semibold hover:text-indigo-800 mt-2"
                >
                  Iniciar sesión aquí
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Gestión de Almacén
            </h1>
            <p className="text-gray-600">Sistema de control de entradas</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
          >
            <LogOut size={20} /> Salir
          </button>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={() => {
              setDateFilter({ fechaInicio: "", fechaFin: "" });
              setView("list");
              resetForm();
            }}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${view === "list" ? "bg-indigo-600 text-white" : "bg-white text-gray-800 border"}`}
          >
            Lista de Entradas
          </button>
          <button
            onClick={() => {
              setView("timeline");
              resetForm();
            }}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${view === "timeline" ? "bg-indigo-600 text-white" : "bg-white text-gray-800 border"}`}
          >
            Por Fechas
          </button>
          <button
            onClick={() => {
              setView("form");
              resetForm();
            }}
            className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${view === "form" ? "bg-indigo-600 text-white" : "bg-white text-gray-800 border"}`}
          >
            <Plus size={20} /> Nueva Entrada
          </button>
          <button
            onClick={() => {
              setView("products");
              setEditingProductId(null);
              setProductForm({ codigo: "", descripcion: "" });
            }}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${view === "products" ? "bg-indigo-600 text-white" : "bg-white text-gray-800 border"}`}
          >
            Productos
          </button>
          <button
            onClick={() => {
              setView("clients");
              setEditingClientId(null);
              setClientForm({
                nombre: "",
                email: "",
                telefono: "",
                direccion: "",
              });
            }}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${view === "clients" ? "bg-indigo-600 text-white" : "bg-white text-gray-800 border"}`}
          >
            Clientes
          </button>
          <button
            onClick={() => {
              setView("carriers");
              setEditingCarrierId(null);
              setCarrierForm({
                nombre: "",
                email: "",
                telefono: "",
                empresa: "",
              });
            }}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${view === "carriers" ? "bg-indigo-600 text-white" : "bg-white text-gray-800 border"}`}
          >
            Transportistas
          </button>
          <button
            onClick={() => setView("report")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${view === "report" ? "bg-indigo-600 text-white" : "bg-white text-gray-800 border"}`}
          >
            <Download size={20} /> Informes
          </button>
        </div>

        {loading && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
            Cargando...
          </div>
        )}

        {view === "form" && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingId ? "Editar Entrada" : "Nueva Entrada"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-1 pb-1">
              <input
                type="text"
                value={formData.numero_entrada}
                onChange={(e) =>
                  setFormData({ ...formData, numero_entrada: e.target.value })
                }
                className="border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Nº Entrada *"
              />
              <input
                type="date"
                value={formData.fecha_entrada}
                onChange={(e) =>
                  setFormData({ ...formData, fecha_entrada: e.target.value })
                }
                className="border border-gray-300 rounded-lg px-4 py-2"
              />
              <select
                value={formData.estado}
                onChange={(e) =>
                  setFormData({ ...formData, estado: e.target.value })
                }
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                <option>Reparación</option>
                <option>Pendiente</option>
                <option>Abono</option>
                <option>Stock</option>
                <option>No stock</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6 pb-6 border-b">
              <select
                value={formData.id_cliente}
                onChange={(e) =>
                  setFormData({ ...formData, id_cliente: e.target.value })
                }
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">Seleccionar Cliente *</option>
                {clientes.map((c) => (
                  <option key={c.ClienteID} value={c.ClienteID}>
                    {c.Nombre}
                  </option>
                ))}
              </select>
              <select
                value={formData.id_transportista}
                onChange={(e) =>
                  setFormData({ ...formData, id_transportista: e.target.value })
                }
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">Seleccionar Transportista</option>
                {transportistas.map((t) => (
                  <option key={t.TransportistaID} value={t.TransportistaID}>
                    {t.Nombre}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={formData.numero_bultos}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    numero_bultos: parseInt(e.target.value) || 1,
                  })
                }
                className="border border-gray-300 rounded-lg px-4 py-2 mb-a"
                placeholder="Numero de Bultos"
                min="1"
                max="99"
              />

              <div className="w-full h-med ">
                <textarea
                  type="text"
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-4 py-2 h-full w-full"
                  placeholder="Observaciones"
                />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Líneas de Productos
            </h3>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
                <select
                  value={lineaActual.id_producto}
                  onChange={(e) =>
                    setLineaActual({
                      ...lineaActual,
                      id_producto: e.target.value,
                      descripcion:
                        productos.find(
                          (p) => p.ProductoID === parseInt(e.target.value),
                        )?.Descripcion || "-",
                      //descripcion: "", // Limpiar descripción al cambiar de artículo
                    })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Seleccionar Producto *</option>
                  {productos.map((p) => (
                    <option key={p.ProductoID} value={p.ProductoID}>
                      {p.Codigo}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={lineaActual.descripcion}
                  onChange={(e) =>
                    setLineaActual({
                      ...lineaActual,
                      descripcion: e.target.value,
                    })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Descripción (opcional)"
                />
                <input
                  type="text"
                  value={lineaActual.rma}
                  onChange={(e) =>
                    setLineaActual({ ...lineaActual, rma: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="RMA (si aplica)"
                />
                <input
                  type="text"
                  value={lineaActual.serie}
                  onChange={(e) =>
                    setLineaActual({ ...lineaActual, serie: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Nº deSerie"
                />
                <input
                  type="number"
                  value={lineaActual.cantidad}
                  onChange={(e) =>
                    setLineaActual({
                      ...lineaActual,
                      cantidad: parseInt(e.target.value) || 1,
                    })
                  }
                  onKeyUp={(e) => {
                    if (e.key === "Enter") {
                      addLinea();
                      //console.log("Enter key pressed!");
                    }
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Cantidad *"
                  min="1"
                  max="99"
                />
                <button
                  onClick={addLinea}
                  type="button"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Agregar
                </button>
              </div>
            </div>

            {formData.lineas.length > 0 && (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left">Código</th>
                      <th className="px-3 py-2 text-left">Descripción</th>
                      <th className="px-3 py-2 text-left">Nº RMA</th>
                      <th className="px-3 py-2 text-left">Nº Serie</th>
                      <th className="px-3 py-2 text-left">Cantidad</th>
                      <th className="px-3 py-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.lineas.map((linea) => (
                      <tr key={linea.temp_id} className="border-t">
                        <td className="px-3 py-2">{linea.codigo || "-"}</td>
                        <td className="px-3 py-2">
                          {linea.descripcion || "-"}
                        </td>
                        <td className="px-3 py-2">{linea.rma || "-"}</td>
                        <td className="px-3 py-2">{linea.serie || "-"}</td>
                        <td className="px-3 py-2">{linea.cantidad || "-"}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => removeLinea(linea.temp_id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className="px-3 py-2 text-right">TOTAL UNIDADES:</td>
                      <td className="px-3 py-2">
                        {formData.lineas.reduce(
                          (total, linea) => total + (linea.cantidad || 0),
                          0,
                        )}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAddEntry}
                disabled={loading}
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {editingId ? "Actualizar Entrada" : "Guardar Entrada"}
              </button>
              <button
                onClick={() => {
                  setView("list");
                  resetForm();
                }}
                className="bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {view === "timeline" && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Entradas por Fechas
              </h2>

              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex gap-2 items-center">
                  <label className="text-sm font-semibold text-gray-700">
                    Desde:
                  </label>
                  <input
                    type="date"
                    value={dateFilter.fechaInicio}
                    onChange={(e) =>
                      setDateFilter({
                        ...dateFilter,
                        fechaInicio: e.target.value,
                      })
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="text-sm font-semibold text-gray-700">
                    Hasta:
                  </label>
                  <input
                    type="date"
                    value={dateFilter.fechaFin}
                    onChange={(e) =>
                      setDateFilter({ ...dateFilter, fechaFin: e.target.value })
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <button
                  onClick={() =>
                    setDateFilter({ fechaInicio: "", fechaFin: "" })
                  }
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
                >
                  Limpiar Filtros
                </button>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="all">Todos los estados</option>
                  <option value="Reparación">Reparacion</option>
                  <option value="Abono">Abono</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Stock">Stock</option>
                  <option value="No stock">No stock</option>
                </select>
              </div>

              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-3 top-3 text-gray-400"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Buscar por entrada, cliente o transportista..."
                />
              </div>
            </div>

            {EntradasByDate.length > 0 ? (
              <div className="space-y-6">
                {EntradasByDate.map(({ fecha, entradas }) => {
                  const totalBultosDia = entradas.reduce(
                    (sum, e) => sum + (e.NumeroBultos || 0),
                    0,
                  );
                  const fechaObj = new Date(fecha + "T00:00:00");
                  const diaSemana = fechaObj.toLocaleDateString("es-ES", {
                    weekday: "long",
                  });
                  const fechaFormateada = fechaObj.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={fecha}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-xl font-bold capitalize">
                              {diaSemana}
                            </h3>
                            <p className="text-indigo-100 text-sm capitalize">
                              {fechaFormateada}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">
                              {entradas.length}
                            </p>
                            <p className="text-indigo-100 text-sm">
                              {entradas.length === 1 ? "entrada" : "entradas"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-indigo-400">
                          <p className="text-sm">
                            Total Bultos:{" "}
                            <span className="font-bold">{totalBultosDia}</span>
                          </p>
                        </div>
                      </div>

                      <div className="divide-y divide-gray-200">
                        {entradas.map((entry) => (
                          <div
                            key={entry.EntradaID}
                            className="p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="font-bold text-indigo-600 text-lg">
                                    {entry.NumeroEntrada}
                                  </span>
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${entry.Estado === "Reparación" ? "bg-green-100 text-green-800" : entry.Estado === "No stock" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                                  >
                                    {entry.Estado}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                  <div>
                                    <span className="font-semibold">
                                      Cliente:
                                    </span>{" "}
                                    {entry.Cliente}
                                  </div>
                                  <div>
                                    <span className="font-semibold">
                                      Transportista:
                                    </span>{" "}
                                    {entry.Transportista || "-"}
                                  </div>
                                  <div>
                                    <span className="font-semibold">
                                      Bultos:
                                    </span>{" "}
                                    <span className="font-bold text-gray-800">
                                      {entry.NumeroBultos || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleViewDetails(entry.EntradaID)
                                  }
                                  className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded"
                                >
                                  <Eye size={18} />
                                </button>
                                <button
                                  onClick={() => handleEdit(entry.EntradaID)}
                                  className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleDelete(entry.EntradaID)}
                                  className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">
                  No hay entradas para el rango de fechas seleccionado
                </p>
              </div>
            )}

            <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-indigo-800">
                Mostrando{" "}
                <span className="font-bold">{filteredEntradas.length}</span>{" "}
                entradas
                {dateFilter.fechaInicio && dateFilter.fechaFin && (
                  <span>
                    {" "}
                    del {dateFilter.fechaInicio} al {dateFilter.fechaFin}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {view === "list" && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  size={20}
                  className="absolute left-3 top-3 text-gray-400"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Buscar..."
                />
              </div>
              <select
                value={numberOfEntries}
                //onChange={(e) => setNumberOfEntries(parseInt(e.target.value))}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setNumberOfEntries(value);
                  localStorage.setItem("numberOfEntries", value);
                }}
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="all">Todos los estados</option>
                <option value="Reparación">Reparacion</option>
                <option value="Abono">Abono</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Stock">Stock</option>
                <option value="No stock">No stock</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-indigo-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Nº Entrada</th>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Transportista</th>
                    <th className="px-4 py-3 text-left">Bultos</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntradas.length > 0 ? (
                    filteredEntradas.map((entry) => (
                      <tr
                        key={entry.EntradaID}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          {entry.FechaEntrada?.split("T")[0]}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {entry.NumeroEntrada}
                        </td>
                        <td className="px-4 py-3">{entry.Cliente}</td>
                        <td className="px-4 py-3">
                          {entry.Transportista || "-"}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {entry.NumeroBultos || 0}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${entry.Estado === "Reparación" ? "bg-yellow-100 text-yellow-800" : entry.Estado === "Abono" ? "bg-blue-100 text-blue-800" : entry.Estado === "Pendiente" ? "bg-gray-100 text-gray-800" : entry.Estado === "Stock" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                          >
                            {entry.Estado}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleViewDetails(entry.EntradaID)}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEdit(entry.EntradaID)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.EntradaID)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-8 text-lg text-center text-gray-500"
                      >
                        No hay entradas registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 mt-4">
              Total: {filteredEntradas.length} entradas
            </p>
          </div>
        )}

        {view === "report" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Generar Informe
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={reportFilters.fechaInicio}
                  onChange={(e) =>
                    setReportFilters({
                      ...reportFilters,
                      fechaInicio: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={reportFilters.fechaFin}
                  onChange={(e) =>
                    setReportFilters({
                      ...reportFilters,
                      fechaFin: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Cliente
                </label>
                <input
                  type="text"
                  value={reportFilters.cliente}
                  onChange={(e) =>
                    setReportFilters({
                      ...reportFilters,
                      cliente: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Filtrar por cliente"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Transportista
                </label>
                <input
                  type="text"
                  value={reportFilters.transportista}
                  onChange={(e) =>
                    setReportFilters({
                      ...reportFilters,
                      transportista: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Filtrar por transportista"
                />
              </div>
            </div>

            <button
              onClick={generateReport}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 mb-6"
            >
              <Download size={20} /> Descargar Informe Detallado en CSV
            </button>

            <div className="mt-8 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h3 className="font-bold text-indigo-900 mb-2">
                Estadísticas Actuales:
              </h3>
              <p className="text-indigo-800">
                Total de entradas:{" "}
                <span className="font-bold">{entradas.length}</span>
              </p>
              <p className="text-indigo-800">
                Bultos totales:{" "}
                <span className="font-bold">
                  {entradas.reduce(
                    (sum, e) => sum + parseInt(e.NumeroBultos || 0),
                    0,
                  )}
                </span>
              </p>
            </div>
          </div>
        )}

        {view === "products" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Gestión de Productos
            </h2>

            <div className="bg-indigo-50 rounded-lg p-6 mb-6 border border-indigo-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {editingProductId ? "Editar Producto" : "Nuevo Producto"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={productForm.codigo}
                  onChange={(e) =>
                    setProductForm({ ...productForm, codigo: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Código del Producto *"
                />
                <input
                  type="text"
                  value={productForm.descripcion}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      descripcion: e.target.value,
                    })
                  }
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Descripción"
                />
              </div>
              <div className="flex gap-4 mt-4">
                <button
                  onClick={handleAddProduct}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-all"
                >
                  {editingProductId ? "Actualizar" : "Crear Producto"}
                </button>
                {editingProductId && (
                  <button
                    onClick={() => {
                      setEditingProductId(null);
                      setProductForm({ codigo: "", descripcion: "" });
                    }}
                    className="bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-500 transition-all"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Lista de Productos
              </h3>
              <table className="w-full text-sm">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Código</th>
                    <th className="px-4 py-3 text-left">Descripción</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.length > 0 ? (
                    productos.map((product) => (
                      <tr
                        key={product.ProductoID}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">{product.ProductoID}</td>
                        <td className="px-4 py-3 font-semibold">
                          {product.Codigo}
                        </td>
                        <td className="px-4 py-3">
                          {product.Descripcion || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteProduct(product.ProductoID)
                              }
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No hay productos registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="text-gray-600 mt-4">
                Total de productos: {productos.length}
              </p>
            </div>
          </div>
        )}

        {view === "clients" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Gestión de Clientes
            </h2>

            <div className="bg-green-50 rounded-lg p-6 mb-6 border border-green-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {editingClientId ? "Editar Cliente" : "Nuevo Cliente"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={clientForm.nombre}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, nombre: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nombre del Cliente *"
                />
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, email: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Email"
                />
                <input
                  type="text"
                  value={clientForm.telefono}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, telefono: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Teléfono"
                />
                <input
                  type="text"
                  value={clientForm.direccion}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, direccion: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Dirección"
                />
              </div>
              <div className="flex gap-4 mt-4">
                <button
                  onClick={handleAddClient}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-all"
                >
                  {editingClientId ? "Actualizar" : "Crear Cliente"}
                </button>
                {editingClientId && (
                  <button
                    onClick={() => {
                      setEditingClientId(null);
                      setClientForm({
                        nombre: "",
                        email: "",
                        telefono: "",
                        direccion: "",
                      });
                    }}
                    className="bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-500 transition-all"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Lista de Clientes
              </h3>
              <table className="w-full text-sm">
                <thead className="bg-green-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Teléfono</th>
                    <th className="px-4 py-3 text-left">Dirección</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.length > 0 ? (
                    clientes.map((client) => (
                      <tr
                        key={client.ClienteID}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">{client.ClienteID}</td>
                        <td className="px-4 py-3 font-semibold">
                          {client.Nombre}
                        </td>
                        <td className="px-4 py-3">{client.Email || "-"}</td>
                        <td className="px-4 py-3">{client.Telefono || "-"}</td>
                        <td className="px-4 py-3">{client.Direccion || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEditClient(client)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteClient(client.ClienteID)
                              }
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No hay clientes registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="text-gray-600 mt-4">
                Total de clientes: {clientes.length}
              </p>
            </div>
          </div>
        )}

        {view === "carriers" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Gestión de Transportistas
            </h2>

            <div className="bg-orange-50 rounded-lg p-6 mb-6 border border-orange-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {editingCarrierId
                  ? "Editar Transportista"
                  : "Nuevo Transportista"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={carrierForm.nombre}
                  onChange={(e) =>
                    setCarrierForm({ ...carrierForm, nombre: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Nombre del Transportista *"
                />
                <input
                  type="email"
                  value={carrierForm.email}
                  onChange={(e) =>
                    setCarrierForm({ ...carrierForm, email: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Email"
                />
                <input
                  type="text"
                  value={carrierForm.telefono}
                  onChange={(e) =>
                    setCarrierForm({ ...carrierForm, telefono: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Teléfono"
                />
                <input
                  type="text"
                  value={carrierForm.empresa}
                  onChange={(e) =>
                    setCarrierForm({ ...carrierForm, empresa: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Empresa"
                />
              </div>
              <div className="flex gap-4 mt-4">
                <button
                  onClick={handleAddCarrier}
                  disabled={loading}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-400 transition-all"
                >
                  {editingCarrierId ? "Actualizar" : "Crear Transportista"}
                </button>
                {editingCarrierId && (
                  <button
                    onClick={() => {
                      setEditingCarrierId(null);
                      setCarrierForm({
                        nombre: "",
                        email: "",
                        telefono: "",
                        empresa: "",
                      });
                    }}
                    className="bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-500 transition-all"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Lista de Transportistas
              </h3>
              <table className="w-full text-sm">
                <thead className="bg-orange-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Teléfono</th>
                    <th className="px-4 py-3 text-left">Empresa</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {transportistas.length > 0 ? (
                    transportistas.map((carrier) => (
                      <tr
                        key={carrier.TransportistaID}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">{carrier.TransportistaID}</td>
                        <td className="px-4 py-3 font-semibold">
                          {carrier.Nombre}
                        </td>
                        <td className="px-4 py-3">{carrier.Email || "-"}</td>
                        <td className="px-4 py-3">{carrier.Telefono || "-"}</td>
                        <td className="px-4 py-3">{carrier.Empresa || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEditCarrier(carrier)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteCarrier(carrier.TransportistaID)
                              }
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No hay transportistas registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="text-gray-600 mt-4">
                Total de transportistas: {transportistas.length}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalles de entrada */}
      {showDetails && selectedEntry && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowDetails(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-indigo-600 text-white p-6 rounded-t-lg flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Detalles de la Entrada</h2>
                <p className="text-indigo-200">
                  Entrada #{selectedEntry.entrada.NumeroEntrada} -{" "}
                  {new Date(
                    selectedEntry.entrada.FechaEntrada,
                  ).toLocaleDateString("es-ES")}
                </p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-white hover:text-indigo-200 transition-all"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">
                    INFORMACIÓN GENERAL
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nº Entrada:</span>
                      <span className="text-gray-800">
                        {selectedEntry.entrada.NumeroEntrada}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha:</span>
                      <span className="text-gray-800">
                        {new Date(
                          selectedEntry.entrada.FechaEntrada,
                        ).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedEntry.entrada.Estado === "Stock" ? "bg-green-100 text-green-800" : selectedEntry.entrada.Estado === "No stock" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                      >
                        {selectedEntry.entrada.Estado}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">
                    CLIENTE
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nombre:</span>
                      <span className="text-gray-800">
                        {selectedEntry.entrada.ClienteNombre}
                      </span>
                    </div>
                    {selectedEntry.entrada.ClienteDireccion && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dirección:</span>
                        <span className="text-gray-800 text-sm">
                          {selectedEntry.entrada.ClienteDireccion}
                        </span>
                      </div>
                    )}
                    {selectedEntry.entrada.ClienteEmail && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="text-gray-800 text-sm">
                          {selectedEntry.entrada.ClienteEmail}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedEntry.entrada.TransportistaNombre && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                      TRANSPORTISTA
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nombre:</span>
                        <span className="text-gray-800">
                          {selectedEntry.entrada.TransportistaNombre}
                        </span>
                      </div>
                      {selectedEntry.entrada.TransportistaEmpresa && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Empresa:</span>
                          <span className="text-gray-800">
                            {selectedEntry.entrada.TransportistaEmpresa}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedEntry.entrada.Observaciones && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                      OBSERVACIONES
                    </h3>
                    <p className="text-gray-800">
                      {selectedEntry.entrada.Observaciones}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 bg-indigo-50 p-4 rounded-lg border-2 border-indigo-200">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  Productos
                </h3>
                <table className="w-full text-sm border">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left">Código</th>
                      <th className="px-3 py-2 text-left">Descripción</th>
                      <th className="px-3 py-2 text-left">Nº RMA</th>
                      <th className="px-3 py-2 text-left">Nº Serie</th>
                      <th className="px-3 py-2 text-left">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEntry.lineas.map((linea) => (
                      <tr key={linea.LineaID} className="border-t">
                        <td className="px-3 py-2">{linea.Codigo || "-"}</td>
                        <td className="px-3 py-2">
                          {linea.Descripcion || "-"}
                        </td>
                        <td className="px-3 py-2 font-semibold">
                          {linea.NumeroRMA || "-"}
                        </td>
                        <td className="px-3 py-2 font-semibold">
                          {linea.NumeroSerie || "-"}
                        </td>
                        <td className="px-3 py-2 font-semibold">
                          {linea.Cantidad || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-indigo-50 p-4 rounded-lg border-2 border-indigo-200">
                <div className="text-left mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Total de Bultos
                  </h3>
                  <p className="text-2xl font-bold text-indigo-600">
                    {selectedEntry.entrada.NumeroBultos || 0} bultos
                  </p>
                </div>
                <div className="text-right mb-2">
                  <p className="text-gray-600 text-sm">Total Unidades</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {selectedEntry.lineas.reduce(
                      (sum, l) => sum + l.Cantidad,
                      0,
                    )}{" "}
                    unidades
                  </p>
                </div>
              </div>

              {/* Botones de acción con PDF y Email */}
              <div className="mt-6 flex gap-3 justify-end flex-wrap">
                <button
                  onClick={handlePrintPDF}
                  disabled={loading}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:bg-gray-400"
                >
                  <Printer size={18} /> Imprimir
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={loading}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 disabled:bg-gray-400"
                >
                  <FileDown size={18} /> Guardar PDF
                </button>
                <button
                  onClick={handleOpenEmailModal}
                  disabled={loading}
                  className="bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-all flex items-center gap-2 disabled:bg-gray-400"
                >
                  <Mail size={18} /> Enviar Email
                </button>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    handleEdit(selectedEntry.entrada.EntradaID);
                  }}
                  className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  <Edit2 size={18} /> Editar
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="bg-gray-400 text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-500 transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de envío de email */}
      {showEmailModal && selectedEntry && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowEmailModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-purple-600 text-white p-5 rounded-t-lg flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Mail size={24} /> Enviar por Email
                </h2>
                <p className="text-purple-200 text-sm">
                  Entrada #{selectedEntry.entrada.NumeroEntrada} -{" "}
                  {new Date(
                    selectedEntry.entrada.FechaEntrada,
                  ).toLocaleDateString("es-ES")}
                </p>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-white hover:text-purple-200 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Destinatario *
                  </label>
                  <input
                    type="email"
                    value={emailForm.destinatario}
                    onChange={(e) =>
                      setEmailForm({
                        ...emailForm,
                        destinatario: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="email@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Asunto
                  </label>
                  <input
                    type="text"
                    value={emailForm.asunto}
                    onChange={(e) =>
                      setEmailForm({ ...emailForm, asunto: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Asunto del email"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Mensaje (opcional)
                  </label>
                  <textarea
                    value={emailForm.mensaje}
                    onChange={(e) =>
                      setEmailForm({ ...emailForm, mensaje: e.target.value })
                    }
                    rows="4"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Mensaje adicional..."
                  />
                </div>

                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <p className="text-purple-800 text-sm">
                    <strong>Nota:</strong> Se adjuntará automáticamente el PDF
                    de la entrada al email.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-4 justify-end">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-500 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-all flex items-center gap-2 disabled:bg-gray-400"
                >
                  {sendingEmail ? (
                    <>Enviando...</>
                  ) : (
                    <>
                      <Send size={18} /> Enviar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
