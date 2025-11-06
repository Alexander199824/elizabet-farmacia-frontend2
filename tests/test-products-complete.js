/**
 * ═══════════════════════════════════════════════════════════════════
 * TEST SUITE COMPLETO - PRODUCTOS, PROVEEDORES Y LOTES
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Autor: Alexander Echeverria
 * Archivo: test-products-complete.js
 * 
 * CORREGIDO BASADO EN:
 * - products.controller.js (usa multer + Cloudinary)
 * - Configuración de Cloudinary
 * - FormData con Buffer correcto
 * 
 * FUNCIONALIDADES:
 * ✓ Crear 4 proveedores (sin NIT para evitar duplicados)
 * ✓ Crear 3 productos CON imagen (suben a Cloudinary)
 * ✓ Crear 1 producto SIN imagen
 * ✓ Crear lotes para cada producto
 * ✓ Mostrar productos públicamente
 * 
 * IMAGEN:
 * C:\Users\echev\Downloads\ESOMEPRAZOL-40MG-CAJA-POR14-TABLETAS-INCLINADO.jpg
 * 
 * EJECUTAR: node test-products-complete.js
 * ═══════════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// IMAGEN REAL
const PRODUCT_IMAGE_PATH = 'C:\\Users\\echev\\Downloads\\ESOMEPRAZOL-40MG-CAJA-POR14-TABLETAS-INCLINADO.jpg';

// Credenciales
const ADMIN_CREDENTIALS = {
    email: 'admin@farmacia.com',
    password: 'Admin123!'
};

// Colores
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    white: '\x1b[37m'
};

// Variables globales
let adminToken = null;
const createdSuppliers = [];
const createdProducts = [];
const createdBatches = [];

// Estadísticas
const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    startTime: null,
    endTime: null
};

// ═══════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════

function printMainHeader() {
    console.log('\n');
    console.log(colors.cyan + colors.bright + '╔═══════════════════════════════════════════════════════════════════╗' + colors.reset);
    console.log(colors.cyan + colors.bright + '║                                                                   ║' + colors.reset);
    console.log(colors.cyan + colors.bright + '║     TEST SUITE - PRODUCTOS, PROVEEDORES Y CLOUDINARY             ║' + colors.reset);
    console.log(colors.cyan + colors.bright + '║     Farmacia Elizabeth - Sistema Completo                        ║' + colors.reset);
    console.log(colors.cyan + colors.bright + '║                                                                   ║' + colors.reset);
    console.log(colors.cyan + colors.bright + '╚═══════════════════════════════════════════════════════════════════╝' + colors.reset);
    console.log(colors.dim + `   Servidor: ${BASE_URL}` + colors.reset);
    console.log(colors.dim + `   Inicio: ${new Date().toLocaleString('es-GT')}` + colors.reset);
    console.log('');
}

function printHeader(text) {
    console.log('\n' + colors.cyan + '═'.repeat(70) + colors.reset);
    console.log(colors.cyan + colors.bright + '  ' + text + colors.reset);
    console.log(colors.cyan + '═'.repeat(70) + colors.reset + '\n');
}

function printSubHeader(text) {
    console.log('\n' + colors.blue + '─'.repeat(65) + colors.reset);
    console.log(colors.blue + colors.bright + '  ' + text + colors.reset);
    console.log(colors.blue + '─'.repeat(65) + colors.reset);
}

function printSuccess(message) {
    stats.passed++;
    console.log(colors.green + '  ✓ ' + message + colors.reset);
}

function printError(message, error = null) {
    stats.failed++;
    console.log(colors.red + '  ✗ ' + message + colors.reset);
    if (error) {
        console.log(colors.red + '    └─ Error: ' + error.message + colors.reset);
        if (error.response) {
            console.log(colors.red + '    └─ Status: ' + error.response.status + colors.reset);
            console.log(colors.red + '    └─ Data: ' + JSON.stringify(error.response.data, null, 2) + colors.reset);
        }
        // Mostrar stack trace para debugging
        if (error.stack) {
            console.log(colors.dim + '    └─ Stack: ' + error.stack.split('\n').slice(0, 3).join('\n           ') + colors.reset);
        }
    }
}

function printWarning(message) {
    stats.skipped++;
    console.log(colors.yellow + '  ⚠ ' + message + colors.reset);
}

function printInfo(message) {
    console.log(colors.magenta + '    ℹ ' + message + colors.reset);
}

function printDetail(label, value) {
    console.log(colors.dim + `      ${label}: ` + colors.white + value + colors.reset);
}

function printProductCard(product, index) {
    console.log(colors.cyan + `\n  ┌─────────────────────────────────────────────────────────────┐` + colors.reset);
    console.log(colors.cyan + `  │ PRODUCTO ${String(index).padStart(2)}                                               │` + colors.reset);
    console.log(colors.cyan + `  ├─────────────────────────────────────────────────────────────┤` + colors.reset);
    console.log(colors.white + `  │ Nombre:       ${product.name.substring(0, 44).padEnd(44)} │` + colors.reset);
    console.log(colors.white + `  │ SKU:          ${product.sku.substring(0, 44).padEnd(44)} │` + colors.reset);
    console.log(colors.white + `  │ Categoría:    ${product.category.substring(0, 44).padEnd(44)} │` + colors.reset);
    console.log(colors.white + `  │ Precio:       Q${String(product.price).substring(0, 42).padEnd(42)} │` + colors.reset);
    console.log(colors.white + `  │ Stock:        ${String(product.stock).substring(0, 44).padEnd(44)} │` + colors.reset);
    console.log(colors.white + `  │ Proveedor:    ${(product.supplier?.name || 'N/A').substring(0, 44).padEnd(44)} │` + colors.reset);
    console.log(colors.white + `  │ Con imagen:   ${(product.imageUrl ? 'SÍ ✓' : 'NO ✗').padEnd(44)} │` + colors.reset);
    console.log(colors.cyan + `  └─────────────────────────────────────────────────────────────┘` + colors.reset);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════
// VALIDACIÓN DE IMAGEN
// ═══════════════════════════════════════════════════════════════════

function validateImage() {
    printHeader('VALIDACIÓN DE IMAGEN');
    
    printSubHeader('Verificando archivo de imagen');
    
    if (!fs.existsSync(PRODUCT_IMAGE_PATH)) {
        printError(`Imagen no encontrada: ${PRODUCT_IMAGE_PATH}`);
        printWarning('Verifica que el archivo existe');
        return false;
    }
    
    const fileStats = fs.statSync(PRODUCT_IMAGE_PATH);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
    
    printSuccess('✓ Imagen encontrada');
    printDetail('Ruta', PRODUCT_IMAGE_PATH);
    printDetail('Tamaño', `${fileSizeMB} MB`);
    printDetail('Modificada', fileStats.mtime.toLocaleString('es-GT'));
    
    const ext = path.extname(PRODUCT_IMAGE_PATH).toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    if (validExtensions.includes(ext)) {
        printSuccess(`✓ Extensión válida: ${ext}`);
        return true;
    } else {
        printError(`Extensión no válida: ${ext}`);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════
// PREPARACIÓN
// ═══════════════════════════════════════════════════════════════════

async function setup() {
    printHeader('PREPARACIÓN DE TESTS');
    
    printSubHeader('1. Autenticación como Administrador');
    try {
        const response = await axios.post(`${API_URL}/users/login`, ADMIN_CREDENTIALS);
        stats.total++;
        adminToken = response.data.token;
        printSuccess('Login exitoso');
        printDetail('Usuario', response.data.user.email);
        printDetail('Role', response.data.user.role);
        printDetail('Token', adminToken.substring(0, 40) + '...');
    } catch (error) {
        stats.total++;
        printError('ERROR CRÍTICO: No se pudo autenticar', error);
        process.exit(1);
    }
}

// ═══════════════════════════════════════════════════════════════════
// CREAR PROVEEDORES
// ═══════════════════════════════════════════════════════════════════

async function testCreateSuppliers() {
    printHeader('CREACIÓN DE PROVEEDORES');
    
    if (!adminToken) {
        printWarning('No hay autenticación - Saltando');
        return;
    }
    
    const timestamp = Date.now();
    
    const suppliersData = [
        {
            code: `PROV-BAYER-${timestamp}`,
            name: 'Laboratorios Bayer de Guatemala',
            email: `bayer${timestamp}@farmacia.com`,
            phone: '2234-5678',
            alternativePhone: '5555-1111',
            contactName: 'Dr. Carlos Méndez',
            address: 'Zona 10, Ciudad de Guatemala',
            acceptsReturns: true,
            returnPolicyMonthsBefore: 3,
            returnPolicyMonthsAfter: 1,
            returnPolicyConditions: 'Producto sellado y en buen estado',
            creditLimit: 150000,
            paymentTerms: '45 días'
        },
        {
            code: `PROV-PFIZER-${timestamp}`,
            name: 'Pfizer Guatemala S.A.',
            email: `pfizer${timestamp}@farmacia.com`,
            phone: '2345-6789',
            alternativePhone: '5555-2222',
            contactName: 'Lic. María González',
            address: 'Zona 9, Ciudad de Guatemala',
            acceptsReturns: true,
            returnPolicyMonthsBefore: 2,
            creditLimit: 200000,
            paymentTerms: '30 días'
        },
        {
            code: `PROV-ROCHE-${timestamp}`,
            name: 'Productos Roche Guatemala',
            email: `roche${timestamp}@farmacia.com`,
            phone: '2456-7890',
            alternativePhone: '5555-3333',
            contactName: 'Dr. Roberto Sánchez',
            address: 'Zona 14, Ciudad de Guatemala',
            acceptsReturns: true,
            returnPolicyMonthsBefore: 4,
            creditLimit: 180000,
            paymentTerms: '60 días'
        },
        {
            code: `PROV-GENERICO-${timestamp}`,
            name: 'Distribuidora de Genéricos S.A.',
            email: `genericos${timestamp}@farmacia.com`,
            phone: '2567-8901',
            alternativePhone: '5555-4444',
            contactName: 'Lic. Ana López',
            address: 'Zona 12, Ciudad de Guatemala',
            acceptsReturns: true,
            returnPolicyMonthsBefore: 2,
            creditLimit: 100000,
            paymentTerms: '30 días'
        }
    ];
    
    for (let i = 0; i < suppliersData.length; i++) {
        printSubHeader(`${i + 1}. Crear Proveedor: ${suppliersData[i].name}`);
        
        try {
            const response = await axios.post(`${API_URL}/suppliers`, suppliersData[i], {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            createdSuppliers.push({
                id: response.data.supplier.id,
                code: response.data.supplier.code,
                name: response.data.supplier.name
            });
            
            printSuccess('Proveedor creado exitosamente');
            printDetail('ID', response.data.supplier.id);
            printDetail('Código', response.data.supplier.code);
            printDetail('Nombre', response.data.supplier.name);
            printDetail('Email', response.data.supplier.email);
            printDetail('Teléfono', response.data.supplier.phone);
            printDetail('Límite crédito', `Q${response.data.supplier.creditLimit}`);
            printDetail('Acepta devoluciones', response.data.supplier.acceptsReturns ? 'SÍ' : 'NO');
            
        } catch (error) {
            stats.total++;
            printError(`Error al crear proveedor ${i + 1}`, error);
        }
        
        await sleep(300);
    }
    
    printInfo(`Total proveedores creados: ${createdSuppliers.length}`);
}

// ═══════════════════════════════════════════════════════════════════
// CREAR PRODUCTOS CON IMAGEN (MÉTODO CORREGIDO)
// ═══════════════════════════════════════════════════════════════════

async function createProductWithImage(productData) {
    const FormData = require('form-data');
    const formData = new FormData();

    // ✅ IMPORTANTE: Primero agregar la imagen
    const imageStream = fs.createReadStream(PRODUCT_IMAGE_PATH);
    formData.append('image', imageStream);

    // Después agregar todos los campos del producto
    Object.keys(productData).forEach(key => {
        formData.append(key, String(productData[key]));
    });

    try {
        const response = await axios.post(`${API_URL}/products`, formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${adminToken}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        return response.data;
    } catch (error) {
        throw error;
    }
}

async function testCreateProducts() {
    printHeader('CREACIÓN DE PRODUCTOS');
    
    if (!adminToken || createdSuppliers.length === 0) {
        printWarning('No hay autenticación o proveedores - Saltando');
        return;
    }
    
    // PRODUCTO 1: CON IMAGEN - IBUPROFENO (Bayer)
    printSubHeader('1. Crear: IBUPROFENO 400mg (CON IMAGEN)');
    try {
        const productData = {
            sku: `IBU-${Date.now()}`,
            name: 'Ibuprofeno 400mg',
            genericName: 'Ibuprofeno',
            description: 'Antiinflamatorio y analgésico no esteroideo',
            category: 'medicamento',
            subcategory: 'analgésicos',
            presentation: 'Caja x 20 tabletas recubiertas',
            requiresPrescription: false,
            supplierId: createdSuppliers[0].id,
            price: 45.50,
            costPrice: 28.00,
            minStock: 10,
            maxStock: 200,
            barcode: `7501${Date.now().toString().slice(-9)}`,
            laboratory: 'Bayer',
            activeIngredient: 'Ibuprofeno 400mg',
            sideEffects: 'Náuseas, mareos, dolor estomacal',
            contraindications: 'Úlcera gástrica activa, alergia a AINEs'
        };
        
        const result = await createProductWithImage(productData);
        stats.total++;
        
        createdProducts.push({
            id: result.product.id,
            name: result.product.name,
            sku: result.product.sku,
            supplierId: createdSuppliers[0].id,
            supplierName: createdSuppliers[0].name
        });
        
        printSuccess('Producto creado exitosamente');
        printDetail('ID', result.product.id);
        printDetail('SKU', result.product.sku);
        printDetail('Nombre', result.product.name);
        printDetail('Proveedor', createdSuppliers[0].name);
        printDetail('Precio', `Q${result.product.price}`);
        printDetail('Imagen URL', result.product.imageUrl);
        
        if (result.product.cloudinaryPublicId) {
            printDetail('Cloudinary ID', result.product.cloudinaryPublicId);
            printSuccess('✓ Imagen subida correctamente a Cloudinary');
        }
        
    } catch (error) {
        stats.total++;
        printError('Error al crear producto 1', error);
    }
    
    await sleep(800);
    
    // PRODUCTO 2: CON IMAGEN - PARACETAMOL (Pfizer)
    printSubHeader('2. Crear: PARACETAMOL 500mg (CON IMAGEN)');
    try {
        const productData = {
            sku: `PARA-${Date.now()}`,
            name: 'Paracetamol 500mg',
            genericName: 'Paracetamol',
            description: 'Analgésico y antipirético de amplio uso',
            category: 'medicamento',
            subcategory: 'analgésicos',
            presentation: 'Frasco x 100 tabletas',
            requiresPrescription: false,
            supplierId: createdSuppliers[1].id,
            price: 35.00,
            costPrice: 20.00,
            minStock: 15,
            maxStock: 150,
            barcode: `7502${Date.now().toString().slice(-9)}`,
            laboratory: 'Pfizer',
            activeIngredient: 'Paracetamol 500mg',
            sideEffects: 'Raros en dosis terapéuticas',
            contraindications: 'Insuficiencia hepática severa'
        };
        
        const result = await createProductWithImage(productData);
        stats.total++;
        
        createdProducts.push({
            id: result.product.id,
            name: result.product.name,
            sku: result.product.sku,
            supplierId: createdSuppliers[1].id,
            supplierName: createdSuppliers[1].name
        });
        
        printSuccess('Producto creado exitosamente');
        printDetail('ID', result.product.id);
        printDetail('Nombre', result.product.name);
        printDetail('Proveedor', createdSuppliers[1].name);
        printDetail('Imagen URL', result.product.imageUrl);
        
        if (result.product.cloudinaryPublicId) {
            printSuccess('✓ Imagen subida correctamente a Cloudinary');
        }
        
    } catch (error) {
        stats.total++;
        printError('Error al crear producto 2', error);
    }
    
    await sleep(800);
    
    // PRODUCTO 3: CON IMAGEN - AMOXICILINA (Roche)
    printSubHeader('3. Crear: AMOXICILINA 500mg (CON IMAGEN)');
    try {
        const productData = {
            sku: `AMOX-${Date.now()}`,
            name: 'Amoxicilina 500mg',
            genericName: 'Amoxicilina',
            description: 'Antibiótico betalactámico de amplio espectro',
            category: 'medicamento',
            subcategory: 'antibióticos',
            presentation: 'Caja x 12 cápsulas',
            requiresPrescription: true,
            supplierId: createdSuppliers[2].id,
            price: 85.00,
            costPrice: 50.00,
            minStock: 20,
            maxStock: 100,
            barcode: `7503${Date.now().toString().slice(-9)}`,
            laboratory: 'Roche',
            activeIngredient: 'Amoxicilina trihidratada 500mg',
            sideEffects: 'Diarrea, náuseas, erupción cutánea',
            contraindications: 'Alergia a penicilinas'
        };
        
        const result = await createProductWithImage(productData);
        stats.total++;
        
        createdProducts.push({
            id: result.product.id,
            name: result.product.name,
            sku: result.product.sku,
            supplierId: createdSuppliers[2].id,
            supplierName: createdSuppliers[2].name
        });
        
        printSuccess('Producto creado exitosamente');
        printDetail('ID', result.product.id);
        printDetail('Nombre', result.product.name);
        printDetail('Proveedor', createdSuppliers[2].name);
        printDetail('Requiere receta', 'SÍ ⚕');
        printDetail('Imagen URL', result.product.imageUrl);
        
        if (result.product.cloudinaryPublicId) {
            printSuccess('✓ Imagen subida correctamente a Cloudinary');
        }
        
    } catch (error) {
        stats.total++;
        printError('Error al crear producto 3', error);
    }
    
    await sleep(800);
    
    // PRODUCTO 4: SIN IMAGEN - LORATADINA (Genérico)
    printSubHeader('4. Crear: LORATADINA 10mg (SIN IMAGEN)');
    try {
        const response = await axios.post(`${API_URL}/products`, {
            sku: `LORA-${Date.now()}`,
            name: 'Loratadina 10mg',
            genericName: 'Loratadina',
            description: 'Antihistamínico para alergias',
            category: 'medicamento',
            subcategory: 'antihistamínicos',
            presentation: 'Caja x 10 tabletas',
            requiresPrescription: false,
            supplierId: createdSuppliers[3].id,
            price: 25.00,
            costPrice: 15.00,
            minStock: 5,
            maxStock: 80,
            barcode: `7504${Date.now().toString().slice(-9)}`,
            laboratory: 'Genérico',
            activeIngredient: 'Loratadina 10mg',
            sideEffects: 'Somnolencia leve',
            contraindications: 'Hipersensibilidad conocida'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        stats.total++;
        
        createdProducts.push({
            id: response.data.product.id,
            name: response.data.product.name,
            sku: response.data.product.sku,
            supplierId: createdSuppliers[3].id,
            supplierName: createdSuppliers[3].name
        });
        
        printSuccess('Producto SIN imagen creado exitosamente');
        printDetail('ID', response.data.product.id);
        printDetail('SKU', response.data.product.sku);
        printDetail('Nombre', response.data.product.name);
        printDetail('Proveedor', createdSuppliers[3].name);
        printDetail('Precio', `Q${response.data.product.price}`);
        printDetail('Imagen', response.data.product.imageUrl || 'Sin imagen ✓');
        
        if (!response.data.product.imageUrl) {
            printSuccess('✓ Producto creado correctamente SIN imagen');
        }
        
    } catch (error) {
        stats.total++;
        printError('Error al crear producto sin imagen', error);
    }
    
    await sleep(500);
    
    printInfo(`Total productos creados: ${createdProducts.length}`);
}

// ═══════════════════════════════════════════════════════════════════
// CREAR LOTES
// ═══════════════════════════════════════════════════════════════════

async function testCreateBatches() {
    printHeader('CREACIÓN DE LOTES PARA PRODUCTOS');
    
    if (!adminToken || createdProducts.length === 0) {
        printWarning('No hay datos previos - Saltando');
        return;
    }
    
    for (let i = 0; i < createdProducts.length; i++) {
        const product = createdProducts[i];
        
        printSubHeader(`${i + 1}. Crear Lote: ${product.name}`);
        
        try {
            const manufacturing = new Date();
            manufacturing.setMonth(manufacturing.getMonth() - 2);
            
            const expiration = new Date();
            expiration.setMonth(expiration.getMonth() + 10);
            
            const response = await axios.post(`${API_URL}/batches`, {
                productId: product.id,
                supplierId: product.supplierId,
                batchNumber: `LOTE-${Date.now()}-${i}`,
                manufacturingDate: manufacturing.toISOString().split('T')[0],
                expirationDate: expiration.toISOString().split('T')[0],
                initialQuantity: 200 + (i * 50),
                purchasePrice: 20.00 + (i * 5),
                salePrice: 35.00 + (i * 10),
                location: `ESTANTE-${String.fromCharCode(65 + i)}-${i + 1}`,
                invoiceNumber: `FAC-${Date.now()}-${i}`,
                notes: `Lote de prueba para ${product.name} - Proveedor: ${product.supplierName}`
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            
            createdBatches.push({
                id: response.data.batch.id,
                productId: product.id,
                productName: product.name,
                batchNumber: response.data.batch.batchNumber
            });
            
            printSuccess('Lote creado exitosamente');
            printDetail('ID Lote', response.data.batch.id);
            printDetail('Número', response.data.batch.batchNumber);
            printDetail('Producto', product.name);
            printDetail('Proveedor', product.supplierName);
            printDetail('Cantidad', response.data.batch.initialQuantity);
            printDetail('Estado', response.data.batch.status);
            printDetail('Ubicación', response.data.batch.location);
            printDetail('Vence', response.data.batch.expirationDate);
            
        } catch (error) {
            stats.total++;
            printError(`Error al crear lote para ${product.name}`, error);
        }
        
        await sleep(300);
    }
    
    printInfo(`Total lotes creados: ${createdBatches.length}`);
}

// ═══════════════════════════════════════════════════════════════════
// MOSTRAR PRODUCTOS PÚBLICAMENTE
// ═══════════════════════════════════════════════════════════════════

async function showCreatedProductsPublicly() {
    printHeader('PRODUCTOS CREADOS - VISTA PÚBLICA (SIN LOGIN)');
    
    printInfo('Obteniendo productos creados en este test...');
    console.log('');
    
    for (let i = 0; i < createdProducts.length; i++) {
        const productInfo = createdProducts[i];
        
        try {
            const response = await axios.get(`${API_URL}/products/${productInfo.id}`);
            stats.total++;
            
            const product = response.data;
            
            printProductCard(product, i + 1);
            
            if (product.batches && product.batches.length > 0) {
                printInfo(`Lotes disponibles: ${product.batches.length}`);
                product.batches.forEach((batch, idx) => {
                    printDetail(`  Lote ${idx + 1}`, `${batch.batchNumber} - ${batch.currentQuantity} unidades`);
                });
            }
            
            printSuccess(`✓ Producto obtenido exitosamente (acceso público)`);
            
        } catch (error) {
            stats.total++;
            printError(`Error al obtener producto ${productInfo.name}`, error);
        }
        
        await sleep(200);
    }
    
    printSubHeader('RESUMEN DE PRODUCTOS CREADOS');
    
    console.log(colors.cyan + '\n  TABLA RESUMEN:' + colors.reset);
    console.log(colors.dim + '  ┌────┬─────────────────────────┬──────────────────────────────┬──────────┬───────────┐' + colors.reset);
    console.log(colors.dim + '  │ #  │ Producto                │ Proveedor                    │ Precio   │ Imagen    │' + colors.reset);
    console.log(colors.dim + '  ├────┼─────────────────────────┼──────────────────────────────┼──────────┼───────────┤' + colors.reset);
    
    for (let i = 0; i < createdProducts.length; i++) {
        const p = createdProducts[i];
        
        try {
            const response = await axios.get(`${API_URL}/products/${p.id}`);
            const product = response.data;
            
            const num = String(i + 1).padStart(2);
            const name = product.name.substring(0, 23).padEnd(23);
            const supplier = (product.supplier?.name || 'N/A').substring(0, 28).padEnd(28);
            const price = `Q${product.price}`.padEnd(8);
            const hasImage = product.imageUrl ? 'SÍ ✓'.padEnd(9) : 'NO ✗'.padEnd(9);
            
            console.log(colors.white + `  │ ${num} │ ${name} │ ${supplier} │ ${price} │ ${hasImage} │` + colors.reset);
            
        } catch (error) {
            console.log(colors.red + `  │ ${String(i + 1).padStart(2)} │ ERROR AL OBTENER                                                     │` + colors.reset);
        }
    }
    
    console.log(colors.dim + '  └────┴─────────────────────────┴──────────────────────────────┴──────────┴───────────┘' + colors.reset);
    
    printInfo(`Total productos mostrados: ${createdProducts.length}`);
    
    if (createdProducts.length > 0) {
        const withImage = createdProducts.length - 1;
        printInfo(`Productos con imagen: ${withImage}`);
        printInfo(`Productos sin imagen: 1`);
    }
}

// ═══════════════════════════════════════════════════════════════════
// REPORTE FINAL
// ═══════════════════════════════════════════════════════════════════

function printFinalReport() {
    stats.endTime = new Date();
    const duration = ((stats.endTime - stats.startTime) / 1000).toFixed(2);
    
    printHeader('REPORTE FINAL DE TESTS');
    
    console.log(colors.cyan + '\n  RESUMEN GENERAL:' + colors.reset);
    console.log(colors.white + `    Tests ejecutados:  ${stats.total}` + colors.reset);
    console.log(colors.green + `    ✓ Exitosos:        ${stats.passed}` + colors.reset);
    console.log(colors.red + `    ✗ Fallidos:        ${stats.failed}` + colors.reset);
    console.log(colors.yellow + `    ⚠ Saltados:        ${stats.skipped}` + colors.reset);
    
    const successRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(2) : 0;
    console.log(colors.magenta + `    Tasa de éxito:     ${successRate}%` + colors.reset);
    console.log(colors.dim + `    Duración:          ${duration}s` + colors.reset);
    
    console.log(colors.cyan + '\n  PROVEEDORES CREADOS:' + colors.reset);
    console.log(colors.white + `    Total:             ${createdSuppliers.length}` + colors.reset);
    createdSuppliers.forEach((s, i) => {
        console.log(colors.dim + `      ${i + 1}. ${s.name}` + colors.reset);
    });
    
    console.log(colors.cyan + '\n  PRODUCTOS CREADOS:' + colors.reset);
    console.log(colors.white + `    Total:             ${createdProducts.length}` + colors.reset);
    
    if (createdProducts.length > 0) {
        const withImage = createdProducts.length - 1;
        console.log(colors.green + `    Con imagen:        ${withImage}` + colors.reset);
        console.log(colors.yellow + `    Sin imagen:        1` + colors.reset);
        
        console.log(colors.dim + '\n    Productos creados:' + colors.reset);
        createdProducts.forEach((p, i) => {
            console.log(colors.dim + `      ${i + 1}. ${p.name} (${p.supplierName})` + colors.reset);
        });
    }
    
    console.log(colors.cyan + '\n  LOTES CREADOS:' + colors.reset);
    console.log(colors.white + `    Total:             ${createdBatches.length}` + colors.reset);
    
    console.log('\n' + colors.cyan + '═'.repeat(70) + colors.reset + '\n');
    
    if (stats.failed === 0) {
        console.log(colors.green + colors.bright + '  ✓✓✓ TODOS LOS TESTS PASARON EXITOSAMENTE ✓✓✓' + colors.reset);
    } else {
        console.log(colors.red + colors.bright + `  ✗✗✗ ${stats.failed} TESTS FALLARON ✗✗✗` + colors.reset);
    }
    
    console.log('\n' + colors.cyan + '═'.repeat(70) + colors.reset);
    console.log(colors.dim + `  Finalizado: ${stats.endTime.toLocaleString('es-GT')}` + colors.reset);
    console.log(colors.cyan + '═'.repeat(70) + colors.reset + '\n');
}

// ═══════════════════════════════════════════════════════════════════
// EJECUCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

async function runAllTests() {
    stats.startTime = new Date();
    
    printMainHeader();
    
    if (!validateImage()) {
        printError('ERROR: Imagen no válida. Abortando tests.');
        process.exit(1);
    }
    
    await sleep(1000);
    
    try {
        await setup();
        await sleep(500);
        
        await testCreateSuppliers();
        await sleep(500);
        
        await testCreateProducts();
        await sleep(500);
        
        await testCreateBatches();
        await sleep(500);
        
        await showCreatedProductsPublicly();
        await sleep(500);
        
        printFinalReport();
        
    } catch (error) {
        console.error(colors.red + '\n✗ ERROR CRÍTICO:' + colors.reset);
        console.error(error);
    }
    
    process.exit(stats.failed > 0 ? 1 : 0);
}

// ═══════════════════════════════════════════════════════════════════
// EJECUTAR
// ═══════════════════════════════════════════════════════════════════

runAllTests();