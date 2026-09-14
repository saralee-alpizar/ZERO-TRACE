

const entradaImagen = document.getElementById("entradaImagen");
const zonaCarga = document.getElementById("zonaCarga");
const contenedorVistaPrevia = document.getElementById(
    "contenedorVistaPrevia"
);

const vistaPrevia = document.getElementById("vistaPrevia");
const nombreArchivo = document.getElementById("nombreArchivo");
const detalleArchivo = document.getElementById("detalleArchivo");

const estadoImagen = document.getElementById("estadoImagen");
const mensajeError = document.getElementById("mensajeError");

const botonCambiarImagen = document.getElementById(
    "botonCambiarImagen"
);

const botonAnalizar = document.getElementById("botonAnalizar");


// ---------- Variables principales ----------

// Guarda la imagen seleccionada.
let archivoSeleccionado = null;

// Guarda la dirección temporal utilizada para mostrar la imagen.
let urlVistaPrevia = null;


// ---------- Tipos de archivo permitidos ----------

const formatosPermitidos = [
    "image/jpeg",
    "image/png",
    "image/webp"
];




entradaImagen.addEventListener("change", function () {
    const archivo = entradaImagen.files[0];

    if (archivo) {
        prepararImagen(archivo);
    }
});


// ---------- Preparar y validar la imagen ----------

function prepararImagen(archivo) {

    limpiarMensajeError();

    reiniciarAnalisis();
    reiniciarLimpieza();

    // Verificar que el archivo sea una imagen compatible.
    if (!formatosPermitidos.includes(archivo.type)) {
        mostrarError(
            "Formato no compatible. Selecciona una imagen JPG, JPEG, PNG o WEBP."
        );

        entradaImagen.value = "";
        return;
    }

    // Límite de 20 MB.
    const limiteBytes = 20 * 1024 * 1024;

    if (archivo.size > limiteBytes) {
        mostrarError(
            "La imagen supera el límite de 20 MB. Selecciona una imagen más pequeña."
        );

        entradaImagen.value = "";
        return;
    }

    // Guardar la imagen para utilizarla en las siguientes partes.
    archivoSeleccionado = archivo;

    // Eliminar una dirección temporal anterior.
    if (urlVistaPrevia) {
        URL.revokeObjectURL(urlVistaPrevia);
    }

    // Crear una dirección temporal para mostrar la fotografía.
    urlVistaPrevia = URL.createObjectURL(archivo);

    vistaPrevia.src = urlVistaPrevia;
    nombreArchivo.textContent = archivo.name;

    detalleArchivo.textContent =
        `${obtenerFormato(archivo)} • ${convertirTamano(archivo.size)}`;

    // Ocultar el área para subir archivos.
    zonaCarga.hidden = true;

    // Mostrar la vista previa.
    contenedorVistaPrevia.hidden = false;

    // Activar el botón para analizar.
    botonAnalizar.disabled = false;

    // Actualizar el estado.
    estadoImagen.textContent = "Imagen cargada";
}


// ---------- Cambiar la imagen seleccionada ----------

botonCambiarImagen.addEventListener("click", function () {
    entradaImagen.click();
});


// ---------- Arrastrar y soltar una imagen ----------

zonaCarga.addEventListener("dragover", function (evento) {
    evento.preventDefault();
    zonaCarga.classList.add("arrastrando");
});

zonaCarga.addEventListener("dragleave", function () {
    zonaCarga.classList.remove("arrastrando");
});

zonaCarga.addEventListener("drop", function (evento) {
    evento.preventDefault();
    zonaCarga.classList.remove("arrastrando");

    const archivo = evento.dataTransfer.files[0];

    if (archivo) {
        prepararImagen(archivo);
    }
});


// ---------- Obtener el formato del archivo ----------

function obtenerFormato(archivo) {

    const formatos = {
        "image/jpeg": "JPEG",
        "image/png": "PNG",
        "image/webp": "WEBP"
    };

    return formatos[archivo.type] || "Formato desconocido";
}


// ---------- Convertir bytes a KB o MB ----------

function convertirTamano(bytes) {

    if (bytes < 1024) {
        return `${bytes} bytes`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}


// ---------- Mostrar mensajes de error ----------

function mostrarError(mensaje) {
    mensajeError.textContent = mensaje;
}


// ---------- Limpiar mensajes de error ----------

function limpiarMensajeError() {
    mensajeError.textContent = "";
}


// ======================================================
// ZERO TRACE — PARTE 2
// Lectura y visualización de metadatos
// ======================================================


// ---------- Elementos del reporte ----------

const estadoVacio = document.getElementById("estadoVacio");
const estadoCargando = document.getElementById("estadoCargando");
const resultados = document.getElementById("resultados");

const estadoAnalisis = document.getElementById("estadoAnalisis");
const listaMetadatos = document.getElementById("listaMetadatos");
const listaRiesgos = document.getElementById("listaRiesgos");
const seccionRiesgos = document.getElementById(
    "seccionRiesgos"
);

const nivelGeneral = document.getElementById("nivelGeneral");
const descripcionGeneral = document.getElementById(
    "descripcionGeneral"
);

const avisoAnalisis = document.getElementById("avisoAnalisis");


// Guarda los metadatos reales encontrados.
let metadatosDetectados = {};


// ---------- Presionar “Mostrar datos ocultos” ----------

botonAnalizar.addEventListener("click", function () {

    if (!archivoSeleccionado) {
        mostrarError("Primero debes seleccionar una imagen.");
        return;
    }

    analizarMetadatos();
});


// ---------- Analizar la imagen ----------

async function analizarMetadatos() {

    limpiarMensajeError();
    
estadoVacio.hidden = true;
resultados.hidden = true;
seccionRiesgos.hidden = true;
estadoCargando.hidden = false;

    estadoAnalisis.textContent = "Analizando...";

    try {

        // Verificar que la librería EXIF esté disponible.
        if (typeof exifr === "undefined") {
            throw new Error(
                "No se pudo cargar la librería de metadatos."
            );
        }

        /*
         * La librería examina diferentes bloques de información:
         * EXIF, GPS, XMP e IPTC.
         */
        const datos = await exifr.parse(archivoSeleccionado, {
            tiff: true,
            ifd0: true,
            exif: true,
            gps: true,
            interop: true,
            xmp: true,
            iptc: true,
            jfif: false,
            ihdr: false,
            icc: false,
            makerNote: false,
            userComment: true,
            translateKeys: true,
            translateValues: true,
            reviveValues: true,
            sanitize: true,
            mergeOutput: true
        });

        metadatosDetectados = datos || {};

        // Obtener la resolución directamente de la imagen.
        const dimensiones = await obtenerDimensionesImagen(
            archivoSeleccionado
        );

        mostrarMetadatos(
            metadatosDetectados,
            dimensiones
        );

        estadoCargando.hidden = true;
resultados.hidden = false;
seccionRiesgos.hidden = false;
estadoAnalisis.textContent = "Análisis completo";
    } catch (error) {

        console.error("Error al analizar la imagen:", error);

        estadoCargando.hidden = true;
estadoVacio.hidden = false;
resultados.hidden = true;
seccionRiesgos.hidden = true;
estadoAnalisis.textContent = "Error";

        mostrarError(
            "No fue posible analizar esta imagen. Comprueba el formato o la conexión a internet."
        );
    }
}


// ---------- Mostrar los datos encontrados ----------

function mostrarMetadatos(datosExif, dimensiones) {

    listaMetadatos.innerHTML = "";
    listaRiesgos.innerHTML = "";

    /*
     * Estos datos pertenecen al archivo seleccionado.
     * No necesariamente están guardados dentro de EXIF.
     */
    agregarMetadato(
        "Nombre del archivo",
        archivoSeleccionado.name,
        "Información del archivo"
    );

    agregarMetadato(
        "Formato",
        obtenerFormato(archivoSeleccionado),
        "Información del archivo"
    );

    agregarMetadato(
        "Tamaño",
        convertirTamano(archivoSeleccionado.size),
        "Información del archivo"
    );

    if (dimensiones) {
        agregarMetadato(
            "Resolución",
            `${dimensiones.ancho} × ${dimensiones.alto} píxeles`,
            "Información del archivo"
        );
    }

    const entradasExif = Object.entries(datosExif).filter(
        ([clave, valor]) => {
            return (
                valor !== undefined &&
                valor !== null &&
                valor !== ""
            );
        }
    );

    // No se encontraron metadatos internos.
    if (entradasExif.length === 0) {

        const mensaje = document.createElement("div");
        mensaje.className = "metadato";

        mensaje.innerHTML = `
            <strong>No se detectaron metadatos EXIF</strong>
            <p>
                ZERO TRACE no encontró información EXIF, GPS,
                XMP o IPTC dentro de esta imagen.
            </p>
        `;

        listaMetadatos.appendChild(mensaje);

        nivelGeneral.textContent = "Sin metadatos detectados";

        descripcionGeneral.textContent =
            "No se encontró información interna que permita establecer un riesgo relacionado con metadatos.";

        avisoAnalisis.textContent =
            "El nombre, formato, tamaño y resolución se muestran como características normales del archivo. No se consideran metadatos EXIF.";

         evaluarRiesgos();



        return;
    }

    // Mostrar todos los campos devueltos por la librería.
    entradasExif.forEach(([nombre, valor]) => {

        agregarMetadato(
            convertirNombreMetadato(nombre),
            formatearValorMetadato(valor),
            "Metadato interno"
        );
    });

    nivelGeneral.textContent = "Pendiente de evaluación";

    descripcionGeneral.textContent =
        `Se detectaron ${entradasExif.length} campos internos. En el siguiente paso se evaluará el riesgo de cada uno.`;

    avisoAnalisis.textContent =
        "Los campos marcados como “Metadato interno” fueron encontrados dentro de la imagen. Los datos del archivo se muestran por separado.";
        
        evaluarRiesgos();
}




// ---------- Crear una tarjeta de metadato ----------

function agregarMetadato(nombre, valor, categoria) {

    const tarjeta = document.createElement("div");
    tarjeta.className = "metadato";

    const cabecera = document.createElement("div");
    cabecera.className = "metadato-cabecera";

    const nombreElemento = document.createElement("strong");
    nombreElemento.textContent = nombre;

    const valorElemento = document.createElement("span");
    valorElemento.textContent = valor;

    const categoriaElemento = document.createElement("p");
    categoriaElemento.textContent = categoria;

    cabecera.appendChild(nombreElemento);
    cabecera.appendChild(valorElemento);

    tarjeta.appendChild(cabecera);
    tarjeta.appendChild(categoriaElemento);

    listaMetadatos.appendChild(tarjeta);
}


// ---------- Obtener las dimensiones reales ----------

function obtenerDimensionesImagen(archivo) {

    return new Promise(function (resolver, rechazar) {

        const imagenTemporal = new Image();
        const urlTemporal = URL.createObjectURL(archivo);

        imagenTemporal.onload = function () {

            const dimensiones = {
                ancho: imagenTemporal.naturalWidth,
                alto: imagenTemporal.naturalHeight
            };

            URL.revokeObjectURL(urlTemporal);
            resolver(dimensiones);
        };

        imagenTemporal.onerror = function () {
            URL.revokeObjectURL(urlTemporal);
            rechazar(
                new Error("No se pudo leer la resolución.")
            );
        };

        imagenTemporal.src = urlTemporal;
    });
}


// ---------- Convertir nombres técnicos ----------

function convertirNombreMetadato(nombre) {

    const nombresConocidos = {

    // Dispositivo
    Make: "Marca del dispositivo",
    Model: "Modelo del dispositivo",
    CameraMake: "Marca de la cámara",
    CameraModelName: "Modelo de la cámara",
    DeviceModel: "Modelo del dispositivo",

    // Software
    Software: "Software utilizado",
    CreatorTool: "Herramienta de creación",
    "Creator Tool": "Herramienta de creación",
    ProcessingSoftware: "Software de procesamiento",
    Firmware: "Versión del sistema",
    HostComputer: "Computadora utilizada",

    // Autor e información escrita
    Artist: "Autor",
    Author: "Autor",
    Creator: "Creador",
    Copyright: "Derechos de autor",
    OwnerName: "Nombre del propietario",
    ImageDescription: "Descripción",
    Description: "Descripción",
    UserComment: "Comentario del usuario",
    Comment: "Comentario",
    Title: "Título",

    // Fechas
    DateTime: "Fecha de modificación",
    DateTimeOriginal: "Fecha y hora de captura",
    DateTimeDigitized: "Fecha de digitalización",
    CreateDate: "Fecha de creación",
    DateCreated: "Fecha de creación",
    ModifyDate: "Fecha de modificación",
    MetadataDate: "Fecha de los metadatos",

    // Ubicación
    latitude: "Latitud GPS",
    longitude: "Longitud GPS",
    GPSLatitude: "Latitud GPS",
    GPSLongitude: "Longitud GPS",
    GPSAltitude: "Altitud GPS",
    GPSPosition: "Posición GPS",

    // Dimensiones y orientación
    Orientation: "Orientación",
    ExifImageWidth: "Ancho registrado",
    ExifImageHeight: "Alto registrado",
    PixelXDimension: "Ancho registrado",
    PixelYDimension: "Alto registrado",

    // Configuración de cámara
    ExposureTime: "Tiempo de exposición",
    FNumber: "Apertura de cámara",
    ApertureValue: "Valor de apertura",
    ISO: "Sensibilidad ISO",
    ISOSpeedRatings: "Sensibilidad ISO",
    FocalLength: "Distancia focal",
    FocalLengthIn35mmFormat:
        "Distancia focal equivalente",
    Flash: "Uso del flash",
    WhiteBalance: "Balance de blancos",
    ExposureProgram: "Programa de exposición",
    ExposureMode: "Modo de exposición",
    MeteringMode: "Modo de medición",
    ShutterSpeedValue: "Velocidad de obturación",
    BrightnessValue: "Nivel de brillo",
    DigitalZoomRatio: "Zoom digital",
    SceneType: "Tipo de escena",
    SensingMethod: "Método del sensor",

    // Lente
    LensModel: "Modelo del lente",
    LensMake: "Marca del lente",

    // Información técnica
    CompositeImage: "Imagen compuesta",
    ColorSpace: "Espacio de color",
    ProfileDescription:
        "Descripción del perfil de color"
        };


    if (nombresConocidos[nombre]) {
        return nombresConocidos[nombre];
    }

    // Separar nombres técnicos escritos con mayúsculas.
    return nombre
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/_/g, " ");
}


// ---------- Dar formato a los valores ----------

function formatearValorMetadato(valor) {

    if (valor instanceof Date) {
        return valor.toLocaleString("es-CR");
    }

    if (Array.isArray(valor)) {
        return valor
            .map(function (elemento) {
                return formatearValorMetadato(elemento);
            })
            .join(", ");
    }

    if (valor instanceof Uint8Array) {
        return `Información binaria (${valor.length} bytes)`;
    }

    if (typeof valor === "object") {

        try {
            return JSON.stringify(valor);
        } catch {
            return "Información técnica no representable";
        }
    }

    if (typeof valor === "number") {
        return Number.isInteger(valor)
            ? valor.toString()
            : valor.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
    }

    return String(valor);
}

// ======================================================
// ZERO TRACE — PARTE 3
// Evaluación de riesgos de privacidad
// ======================================================

function evaluarRiesgos() {

    listaRiesgos.innerHTML = "";

    const riesgosEncontrados = [];

    const clavesDetectadas = Object.keys(
        metadatosDetectados
    ).map(normalizarClave);


    // Comprueba si un metadato específico fue detectado.
    function contieneAlgunaClave(...posiblesClaves) {

        return posiblesClaves.some(function (claveBuscada) {

            const claveNormalizada = normalizarClave(claveBuscada);

            return clavesDetectadas.includes(claveNormalizada);
        });
    }


    // ---------- Coordenadas GPS ----------

    if (
        contieneAlgunaClave(
            "latitude",
            "longitude",
            "GPSLatitude",
            "GPSLongitude",
            "GPSPosition"
        )
    ) {
        riesgosEncontrados.push({
            nombre: "Coordenadas GPS",
            nivel: "Alto",
            clase: "nivel-alto",
            prioridad: 4,
            revela: "El lugar donde se tomó la fotografía.",
            mensaje:
                "Riesgo alto: esta imagen contiene información GPS. Una persona externa podría identificar dónde fue tomada y relacionarla con lugares que frecuentas."
        });
    }


    // ---------- Fecha de captura ----------

    if (
        contieneAlgunaClave(
            "DateTimeOriginal",
            "DateTimeDigitized",
            "DateCreated",
            "CreateDate"
        )
    ) {
        riesgosEncontrados.push({
            nombre: "Fecha de captura",
            nivel: "Medio",
            clase: "nivel-medio",
            prioridad: 3,
            revela: "El día en que se tomó o creó la fotografía.",
            mensaje:
                "Precaución: la fecha puede ayudar a determinar cuándo estuviste en un lugar o realizaste una actividad."
        });
    }


    // ---------- Hora de captura ----------

    if (
        contieneAlgunaClave(
            "DateTimeOriginal",
            "DateTimeDigitized",
            "DateCreated",
            "CreateDate",
            "SubSecTimeOriginal",
            "OffsetTimeOriginal"
        )
    ) {
        riesgosEncontrados.push({
            nombre: "Hora de captura",
            nivel: "Medio",
            clase: "nivel-medio",
            prioridad: 3,
            revela: "La hora aproximada o exacta de la captura.",
            mensaje:
                "Precaución: combinada con fechas y otros datos, la hora podría ayudar a identificar patrones en tus actividades."
        });
    }


    // ---------- Marca del dispositivo ----------

    if (
        contieneAlgunaClave(
            "Make",
            "CameraMake",
            "LensMake"
        )
    ) {
        riesgosEncontrados.push({
            nombre: "Marca del dispositivo",
            nivel: "Bajo",
            clase: "nivel-bajo",
            prioridad: 1,
            revela: "El fabricante del celular o cámara.",
            mensaje:
                "Riesgo bajo: la marca no suele ser información crítica por sí sola, pero puede complementar otros datos sobre ti."
        });
    }


    // ---------- Modelo del dispositivo ----------

    if (
        contieneAlgunaClave(
            "Model",
            "CameraModelName",
            "LensModel",
            "DeviceModel"
        )
    ) {
        riesgosEncontrados.push({
            nombre: "Modelo del dispositivo",
            nivel: "Bajo/Medio",
            clase: "nivel-bajo-medio",
            prioridad: 2,
            revela: "El modelo específico del celular, cámara o lente.",
            mensaje:
                "Precaución: un tercero podría combinar el modelo de tu dispositivo con otra información para crear un perfil más detallado."
        });
    }


    // ---------- Autor ----------

    if (
        contieneAlgunaClave(
            "Artist",
            "Author",
            "Creator",
            "By-line",
            "Credit",
            "Copyright",
            "OwnerName"
        )
    ) {
        riesgosEncontrados.push({
            nombre: "Autor o propietario",
            nivel: "Medio",
            clase: "nivel-medio",
            prioridad: 3,
            revela: "Una identidad asociada con la fotografía.",
            mensaje:
                "Precaución: la información de autor podría relacionar directamente la imagen con una persona."
        });
    }


    // ---------- Nombre del archivo ----------

    if (archivoSeleccionado && archivoSeleccionado.name) {
        riesgosEncontrados.push({
            nombre: "Nombre del archivo",
            nivel: "Variable",
            clase: "nivel-bajo-medio",
            prioridad: 2,
            revela: "El nombre asignado a la fotografía.",
            mensaje:
                "Revisa este dato: el nombre del archivo podría contener nombres, fechas, lugares, eventos o información sobre una actividad."
        });
    }


    // ---------- Fecha de creación ----------

    if (
        contieneAlgunaClave(
            "CreateDate",
            "DateCreated",
            "DateTimeDigitized",
            "MetadataDate"
        )
    ) {
        riesgosEncontrados.push({
            nombre: "Fecha de creación",
            nivel: "Medio",
            clase: "nivel-medio",
            prioridad: 3,
            revela: "El momento en que se creó o digitalizó el archivo.",
            mensaje:
                "Precaución: esta fecha podría ayudar a reconstruir una cronología y relacionar la imagen con una actividad."
        });
    }


    // ---------- Descripción o comentario ----------

    if (
        contieneAlgunaClave(
            "ImageDescription",
            "Description",
            "Caption",
            "Caption-Abstract",
            "UserComment",
            "Comment",
            "Title"
        )
    ) {
        riesgosEncontrados.push({
            nombre: "Descripción o comentario",
            nivel: "Variable",
            clase: "nivel-medio",
            prioridad: 3,
            revela: "Texto escrito y almacenado dentro de la imagen.",
            mensaje:
                "Revisa este dato: una descripción o comentario podría contener nombres, ubicaciones, actividades u otra información personal."
        });
    }


    // ---------- Configuración de cámara ----------

    if (
        contieneAlgunaClave(
            "ExposureTime",
            "FNumber",
            "ISO",
            "ISOSpeedRatings",
            "FocalLength",
            "Flash",
            "WhiteBalance",
            "ExposureProgram",
            "ExposureMode",
            "MeteringMode",
            "ShutterSpeedValue",
            "ApertureValue",
            "BrightnessValue",
            "SceneType",
            "SensingMethod"
        )
    ) {
        riesgosEncontrados.push({
            nombre: "Configuración de cámara",
            nivel: "Bajo",
            clase: "nivel-bajo",
            prioridad: 1,
            revela: "Las condiciones técnicas utilizadas al tomar la foto.",
            mensaje:
                "Riesgo bajo: esta información normalmente no identifica directamente al usuario, pero puede caracterizar la cámara y las condiciones de captura."
        });
    }


    // ---------- Orientación ----------

    if (contieneAlgunaClave("Orientation")) {
        riesgosEncontrados.push({
            nombre: "Orientación de la imagen",
            nivel: "Bajo",
            clase: "nivel-bajo",
            prioridad: 1,
            revela: "La posición del dispositivo al tomar la fotografía.",
            mensaje:
                "Riesgo bajo: la orientación normalmente no representa un riesgo significativo por sí sola."
        });
    }


    // ---------- Resolución ----------

    riesgosEncontrados.push({
        nombre: "Resolución",
        nivel: "Bajo",
        clase: "nivel-bajo",
        prioridad: 1,
        revela: "Las dimensiones de la fotografía.",
        mensaje:
            "Riesgo bajo: la resolución es información técnica y normalmente no expone información personal."
    });


    // ---------- Tamaño del archivo ----------

    riesgosEncontrados.push({
        nombre: "Tamaño del archivo",
        nivel: "Mínimo",
        clase: "nivel-bajo",
        prioridad: 1,
        revela: "La cantidad de almacenamiento que ocupa.",
        mensaje:
            "Riesgo mínimo: el tamaño es información técnica y normalmente no permite identificarte."
    });


    // ---------- Formato del archivo ----------

    riesgosEncontrados.push({
        nombre: "Formato del archivo",
        nivel: "Mínimo",
        clase: "nivel-bajo",
        prioridad: 1,
        revela: "El tipo de archivo, por ejemplo JPEG o PNG.",
        mensaje:
            "Riesgo mínimo: el formato no suele representar un riesgo para la privacidad."
    });


    // ---------- Información de modificaciones ----------

    if (
        contieneAlgunaClave(
            "History",
            "DerivedFrom",
            "DocumentID",
            "InstanceID",
            "OriginalDocumentID",
            "ModifyDate"
        )
    ) {
        riesgosEncontrados.push({
            nombre: "Información de modificación",
            nivel: "Variable",
            clase: "nivel-bajo-medio",
            prioridad: 2,
            revela: "Datos relacionados con cambios efectuados al archivo.",
            mensaje:
                "Revisa este dato: la información de modificación podría revelar fechas, programas utilizados o detalles sobre el origen del archivo."
        });
    }


    // ---------- Información técnica adicional ----------

    if (
        contieneAlgunaClave(
            "Software",
            "CreatorTool",
            "Creator Tool",
            "HostComputer",
            "ProcessingSoftware",
            "Firmware",
            "ColorSpace",
            "ProfileDescription"
        )
    ) {
        riesgosEncontrados.push({
            nombre: "Información técnica adicional",
            nivel: "Variable",
            clase: "nivel-bajo-medio",
            prioridad: 2,
            revela: "El software o sistema utilizado para crear o editar la imagen.",
            mensaje:
                "Precaución: esta información podría complementar otros datos sobre tu dispositivo o la manera en que se produjo la fotografía."
        });
    }


    // Mostrar primero los riesgos más importantes.
    riesgosEncontrados.sort(function (a, b) {
        return b.prioridad - a.prioridad;
    });


    // Crear las tarjetas de riesgos.
    riesgosEncontrados.forEach(function (riesgo) {
        agregarTarjetaRiesgo(riesgo);
    });


    // Calcular el nivel general.
    actualizarNivelGeneral(riesgosEncontrados);
}


// ---------- Crear una tarjeta de riesgo ----------

function agregarTarjetaRiesgo(riesgo) {

    const barra = document.createElement("article");

    /*
     * Convierte, por ejemplo:
     * "nivel-alto" en "riesgo-alto".
     */
    const claseGrafico = riesgo.clase.replace(
        "nivel-",
        "riesgo-"
    );

    barra.className =
        `barra-riesgo ${claseGrafico}`;

    /*
     * También permite mostrar el mensaje usando
     * el teclado, además de pasar el cursor.
     */
    barra.tabIndex = 0;

    barra.setAttribute(
        "aria-label",
        `${riesgo.nombre}. Nivel ${riesgo.nivel}`
    );


    // ---------- Espacio y color de la barra ----------

    const areaBarra = document.createElement("div");
    areaBarra.className = "area-barra";

    const barraVisual = document.createElement("div");
    barraVisual.className = "barra-visual";

    areaBarra.appendChild(barraVisual);


    // ---------- Nombre corto debajo de la barra ----------

    const nombreBarra = document.createElement("span");
    nombreBarra.className = "nombre-barra";
    nombreBarra.textContent = obtenerNombreCortoRiesgo(
        riesgo.nombre
    );


    // ---------- Mensaje que aparece con el cursor ----------

    const detalle = document.createElement("div");
    detalle.className = "detalle-barra";

    const titulo = document.createElement("strong");
    titulo.textContent =
        `${riesgo.nombre} — Riesgo ${riesgo.nivel}`;

    const informacionRevelada = document.createElement("p");
    informacionRevelada.textContent =
        `Qué revela: ${riesgo.revela}`;

    const mensaje = document.createElement("p");
    mensaje.textContent = riesgo.mensaje;

    detalle.appendChild(titulo);
    detalle.appendChild(informacionRevelada);
    detalle.appendChild(mensaje);


    // ---------- Construir la barra completa ----------

    barra.appendChild(areaBarra);
    barra.appendChild(nombreBarra);
    barra.appendChild(detalle);

    listaRiesgos.appendChild(barra);
}

// ---------- Crear nombres cortos para el gráfico ----------

function obtenerNombreCortoRiesgo(nombre) {

    const nombresCortos = {
        "Coordenadas GPS": "GPS",
        "Fecha de captura": "Fecha",
        "Hora de captura": "Hora",
        "Marca del dispositivo": "Marca",
        "Modelo del dispositivo": "Modelo",
        "Autor o propietario": "Autor",
        "Nombre del archivo": "Archivo",
        "Fecha de creación": "Creación",
        "Descripción o comentario": "Descripción",
        "Configuración de cámara": "Cámara",
        "Orientación de la imagen": "Orientación",
        "Resolución": "Resolución",
        "Tamaño del archivo": "Tamaño",
        "Formato del archivo": "Formato",
        "Información de modificación": "Modificación",
        "Información técnica adicional": "Técnica"
    };

    return nombresCortos[nombre] || nombre;
}
// ---------- Calcular el nivel general ----------

function actualizarNivelGeneral(riesgos) {

    const prioridades = riesgos.map(function (riesgo) {
        return riesgo.prioridad;
    });

    const mayorPrioridad = Math.max(...prioridades);

    if (mayorPrioridad === 4) {
        nivelGeneral.textContent = "Alto";

        descripcionGeneral.textContent =
            "La imagen contiene información de ubicación que podría exponer un lugar relacionado contigo.";

        return;
    }

    if (mayorPrioridad === 3) {
        nivelGeneral.textContent = "Medio";

        descripcionGeneral.textContent =
            "La imagen contiene información que podría ayudar a establecer fechas, actividades o relaciones personales.";

        return;
    }

    if (mayorPrioridad === 2) {
        nivelGeneral.textContent = "Bajo/Medio";

        descripcionGeneral.textContent =
            "La imagen contiene datos que podrían complementar un perfil sobre el usuario o su dispositivo.";

        return;
    }

    nivelGeneral.textContent = "Bajo";

    descripcionGeneral.textContent =
        "Solo se detectaron características técnicas de bajo impacto para la privacidad.";
}


// ---------- Normalizar nombres técnicos ----------

function normalizarClave(clave) {

    return String(clave)
        .toLowerCase()
        .replace(/[\s_-]/g, "");
}


// ======================================================
// ZERO TRACE — PARTE 4
// Navegación entre las pantallas
// ======================================================


// ---------- Pantallas ----------

const pantallaAnalisis = document.getElementById(
    "pantallaAnalisis"
);

const pantallaLimpieza = document.getElementById(
    "pantallaLimpieza"
);

const pantallaInformacion = document.getElementById(
    "pantallaInformacion"
);


// ---------- Botones de navegación ----------

const botonIrLimpiar = document.getElementById(
    "botonIrLimpiar"
);

const botonVolver = document.getElementById(
    "botonVolver"
);

const botonVolverInformacion = document.getElementById(
    "botonVolverInformacion"
);

const navAnalizar = document.getElementById(
    "navAnalizar"
);

const navInformacion = document.getElementById(
    "navInformacion"
);

const logoInicio = document.getElementById(
    "logoInicio"
);


// ---------- Elementos de la pantalla de limpieza ----------

const imagenOriginalLimpieza = document.getElementById(
    "imagenOriginalLimpieza"
);

const cantidadMetadatos = document.getElementById(
    "cantidadMetadatos"
);


// ---------- Abrir la pantalla para limpiar ----------

botonIrLimpiar.addEventListener("click", function () {

    if (!archivoSeleccionado) {
        mostrarError("Primero debes seleccionar una imagen.");
        return;
    }

    // Mostrar la misma imagen sin pedirla nuevamente.
    imagenOriginalLimpieza.src = urlVistaPrevia;

    const cantidad = Object.keys(
        metadatosDetectados
    ).length;

    if (cantidad === 1) {
        cantidadMetadatos.textContent =
            "1 campo interno detectado";
    } else {
        cantidadMetadatos.textContent =
            `${cantidad} campos internos detectados`;
    }

    mostrarPantalla("limpieza");
});


// ---------- Volver al reporte ----------

botonVolver.addEventListener("click", function () {
    mostrarPantalla("analisis");
});


// ---------- Abrir sección educativa ----------

navInformacion.addEventListener("click", function () {
    mostrarPantalla("informacion");
});


// ---------- Regresar desde la sección educativa ----------

botonVolverInformacion.addEventListener(
    "click",
    function () {
        mostrarPantalla("analisis");
    }
);


// ---------- Botón “Analizar imagen” ----------

navAnalizar.addEventListener("click", function () {
    mostrarPantalla("analisis");
});


// ---------- Presionar el nombre ZERO TRACE ----------

logoInicio.addEventListener("click", function (evento) {
    evento.preventDefault();
    mostrarPantalla("analisis");
});


// ---------- Función para cambiar de pantalla ----------

function mostrarPantalla(pantalla) {

    // Ocultar todas las pantallas.
    pantallaAnalisis.hidden = true;
    pantallaLimpieza.hidden = true;
    pantallaInformacion.hidden = true;

    // Quitar el estado activo de la navegación.
    navAnalizar.classList.remove("activo");
    navInformacion.classList.remove("activo");


    if (pantalla === "analisis") {

        pantallaAnalisis.hidden = false;
        navAnalizar.classList.add("activo");
    }


    if (pantalla === "limpieza") {

        pantallaLimpieza.hidden = false;
    }


    if (pantalla === "informacion") {

        pantallaInformacion.hidden = false;
        navInformacion.classList.add("activo");
    }


    // Regresar al inicio de la pantalla.
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// ======================================================
// ZERO TRACE — PARTE 5
// Eliminar, verificar y descargar metadatos
// ======================================================


// ---------- Elementos de la pantalla de limpieza ----------

const botonBorrarMetadatos = document.getElementById(
    "botonBorrarMetadatos"
);

const resultadoLimpieza = document.getElementById(
    "resultadoLimpieza"
);

const mensajeLimpieza = document.getElementById(
    "mensajeLimpieza"
);

const botonDescargar = document.getElementById(
    "botonDescargar"
);

const botonProbarLimpia = document.getElementById(
    "botonProbarLimpia"
);


// ---------- Variables de la copia procesada ----------

let archivoLimpio = null;
let urlArchivoLimpio = null;
let metadatosRestantes = {};


// ---------- Presionar “Borrar metadatos” ----------

botonBorrarMetadatos.addEventListener(
    "click",
    async function () {

        if (!archivoSeleccionado) {
            mensajeLimpieza.textContent =
                "No hay ninguna imagen para procesar.";

            resultadoLimpieza.hidden = false;
            return;
        }

        botonBorrarMetadatos.disabled = true;
        botonBorrarMetadatos.textContent =
            "Procesando imagen...";

        resultadoLimpieza.hidden = true;

        try {

            // Crear una copia nueva a partir de los píxeles.
            const blobLimpio = await crearCopiaSinMetadatos(
                archivoSeleccionado
            );

            // Crear un nombre para la copia.
            const nombreLimpio = crearNombreArchivoLimpio(
                archivoSeleccionado.name,
                blobLimpio.type
            );

            archivoLimpio = new File(
                [blobLimpio],
                nombreLimpio,
                {
                    type: blobLimpio.type,
                    lastModified: Date.now()
                }
            );

            // Verificar la copia con Exifr.
            metadatosRestantes = await verificarMetadatos(
                archivoLimpio
            );

            const cantidadRestante = Object.keys(
                metadatosRestantes
            ).length;

            // Eliminar una dirección anterior.
            if (urlArchivoLimpio) {
                URL.revokeObjectURL(urlArchivoLimpio);
            }

            urlArchivoLimpio = URL.createObjectURL(
                archivoLimpio
            );

            /*
             * Actualizar la imagen de la pantalla.
             * Ya no muestra el archivo original,
             * sino la copia procesada.
             */
            imagenOriginalLimpieza.src = urlArchivoLimpio;

            const panelImagen = imagenOriginalLimpieza.closest(
                ".panel"
            );

            const etiquetaPanel = panelImagen.querySelector(
                ".numero-paso"
            );

            const tituloPanel = panelImagen.querySelector("h2");

            etiquetaPanel.textContent = "IMAGEN PROCESADA";
            tituloPanel.textContent = "Después de la limpieza";

            resultadoLimpieza.hidden = false;

            if (cantidadRestante === 0) {

                mensajeLimpieza.textContent =
                    "La verificación no detectó metadatos EXIF, GPS, XMP o IPTC en la copia procesada.";

                botonDescargar.textContent =
                    "Descargar imagen limpia";

            } else {

                mensajeLimpieza.textContent =
                    `La copia fue procesada, pero la verificación todavía detectó ${cantidadRestante} campos internos. No se puede afirmar que esté completamente limpia.`;

                botonDescargar.textContent =
                    "Descargar imagen procesada";
            }

            botonBorrarMetadatos.textContent =
                "Imagen procesada";

        } catch (error) {

            console.error(
                "Error al eliminar metadatos:",
                error
            );

            resultadoLimpieza.hidden = false;

            mensajeLimpieza.textContent =
                "No fue posible procesar la imagen. Intenta nuevamente con un archivo JPG, PNG o WEBP.";

            botonBorrarMetadatos.textContent =
                "Intentar nuevamente";
        }

        botonBorrarMetadatos.disabled = false;
    }
);


// ---------- Crear una copia nueva sin los datos originales ----------

async function crearCopiaSinMetadatos(archivo) {

    const imagen = await cargarImagenParaCanvas(archivo);

    const canvas = document.createElement("canvas");
    const contexto = canvas.getContext("2d");

    canvas.width = imagen.ancho;
    canvas.height = imagen.alto;

    contexto.drawImage(
        imagen.elemento,
        0,
        0,
        canvas.width,
        canvas.height
    );

    // Liberar memoria si se utilizó createImageBitmap.
    if (
        imagen.elemento &&
        typeof imagen.elemento.close === "function"
    ) {
        imagen.elemento.close();
    }

    const formatoSalida = obtenerFormatoSalida(
        archivo.type
    );

    const calidad =
        formatoSalida === "image/jpeg" ? 0.92 : undefined;

    return new Promise(function (resolver, rechazar) {

        canvas.toBlob(
            function (blob) {

                if (blob) {
                    resolver(blob);
                } else {
                    rechazar(
                        new Error(
                            "El navegador no pudo crear la copia."
                        )
                    );
                }
            },
            formatoSalida,
            calidad
        );
    });
}


// ---------- Cargar la imagen para el canvas ----------

async function cargarImagenParaCanvas(archivo) {

    /*
     * createImageBitmap permite cargar la fotografía
     * directamente desde el archivo.
     */
    if ("createImageBitmap" in window) {

        const mapaImagen = await createImageBitmap(
            archivo,
            {
                imageOrientation: "from-image"
            }
        );

        return {
            elemento: mapaImagen,
            ancho: mapaImagen.width,
            alto: mapaImagen.height
        };
    }

    /*
     * Método alternativo para navegadores que no
     * admitan createImageBitmap.
     */
    return new Promise(function (resolver, rechazar) {

        const imagen = new Image();
        const urlTemporal = URL.createObjectURL(archivo);

        imagen.onload = function () {

            resolver({
                elemento: imagen,
                ancho: imagen.naturalWidth,
                alto: imagen.naturalHeight
            });

            URL.revokeObjectURL(urlTemporal);
        };

        imagen.onerror = function () {

            URL.revokeObjectURL(urlTemporal);

            rechazar(
                new Error("No se pudo cargar la imagen.")
            );
        };

        imagen.src = urlTemporal;
    });
}


// ---------- Elegir el formato de salida ----------

function obtenerFormatoSalida(tipoOriginal) {

    const formatosCompatibles = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (formatosCompatibles.includes(tipoOriginal)) {
        return tipoOriginal;
    }

    return "image/jpeg";
}


// ---------- Crear el nombre del archivo limpio ----------

function crearNombreArchivoLimpio(
    nombreOriginal,
    tipoArchivo
) {

    const nombreSinExtension = nombreOriginal.replace(
        /\.[^/.]+$/,
        ""
    );

    const extensiones = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
    };

    const extension = extensiones[tipoArchivo] || "jpg";

    return `${nombreSinExtension}-sin-metadatos.${extension}`;
}


// ---------- Verificar si la copia conserva metadatos ----------

async function verificarMetadatos(archivo) {

    if (typeof exifr === "undefined") {
        throw new Error(
            "La librería Exifr no está disponible."
        );
    }

    const datos = await exifr.parse(archivo, {
        tiff: true,
        ifd0: true,
        exif: true,
        gps: true,
        interop: true,
        xmp: true,
        iptc: true,
        jfif: false,
        ihdr: false,
        icc: false,
        makerNote: false,
        userComment: true,
        translateKeys: true,
        translateValues: true,
        reviveValues: true,
        sanitize: true,
        mergeOutput: true
    });

    if (!datos) {
        return {};
    }

    /*
     * Guardar solamente campos que realmente
     * contengan algún valor.
     */
    return Object.fromEntries(
        Object.entries(datos).filter(
            function ([clave, valor]) {

                return (
                    valor !== undefined &&
                    valor !== null &&
                    valor !== ""
                );
            }
        )
    );
}


// ---------- Descargar la copia procesada ----------

botonDescargar.addEventListener(
    "click",
    function () {

        if (!archivoLimpio || !urlArchivoLimpio) {
            return;
        }

        const enlaceDescarga = document.createElement("a");

        enlaceDescarga.href = urlArchivoLimpio;
        enlaceDescarga.download = archivoLimpio.name;

        document.body.appendChild(enlaceDescarga);
        enlaceDescarga.click();
        enlaceDescarga.remove();
    }
);


// ---------- Volver a analizar la copia procesada ----------

botonProbarLimpia.addEventListener(
    "click",
    async function () {

        if (!archivoLimpio) {
            return;
        }

        /*
         * La copia procesada se convierte en la nueva
         * imagen seleccionada.
         */
        prepararImagen(archivoLimpio);

        mostrarPantalla("analisis");

        // Analizar automáticamente la nueva copia.
        await analizarMetadatos();
    }
);


// ======================================================
// ZERO TRACE — PARTE 6
// Reiniciar resultados y preparar nuevos análisis
// ======================================================


// ---------- Reiniciar la pantalla de análisis ----------

function reiniciarAnalisis() {

    estadoVacio.hidden = false;
estadoCargando.hidden = true;
resultados.hidden = true;
seccionRiesgos.hidden = true;

    estadoAnalisis.textContent = "Pendiente";

    listaMetadatos.innerHTML = "";
    listaRiesgos.innerHTML = "";

    nivelGeneral.textContent = "Sin determinar";

    descripcionGeneral.textContent =
        "El nivel dependerá de los datos encontrados.";

    avisoAnalisis.textContent =
        "El reporte distinguirá entre metadatos internos y características normales del archivo.";

    metadatosDetectados = {};
}


// ---------- Reiniciar la pantalla de limpieza ----------

function reiniciarLimpieza() {

    resultadoLimpieza.hidden = true;

    mensajeLimpieza.textContent =
        "La imagen está lista para descargarse y verificarse.";

    botonBorrarMetadatos.disabled = false;
    botonBorrarMetadatos.textContent =
        "Borrar metadatos";

    botonDescargar.textContent =
        "Descargar imagen limpia";

    cantidadMetadatos.textContent =
        "0 campos internos detectados";

    archivoLimpio = null;
    metadatosRestantes = {};

    if (urlArchivoLimpio) {
        URL.revokeObjectURL(urlArchivoLimpio);
        urlArchivoLimpio = null;
    }

    /*
     * Restaurar los textos del panel para que vuelva
     * a mostrar que se trata de la imagen original.
     */
    const panelImagen = imagenOriginalLimpieza.closest(
        ".panel"
    );

    if (panelImagen) {

        const etiquetaPanel = panelImagen.querySelector(
            ".numero-paso"
        );

        const tituloPanel = panelImagen.querySelector("h2");

        if (etiquetaPanel) {
            etiquetaPanel.textContent =
                "IMAGEN ORIGINAL";
        }

        if (tituloPanel) {
            tituloPanel.textContent =
                "Antes de la limpieza";
        }
    }
}