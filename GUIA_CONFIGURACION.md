# Guía de Configuración - CRUD de Productos

## 🔧 Pasos para Habilitar el CRUD de Productos

### Paso 1: Configurar Firestore en Firebase Console

1. **Abre Firebase Console:**
   - Ve a: https://console.firebase.google.com/
   - Inicia sesión con tu cuenta de Google

2. **Selecciona el proyecto:**
   - Busca y haz clic en "login-d7825"

3. **Accede a Firestore Database:**
   - En el menú izquierdo, busca "Firestore Database"
   - Haz clic en él

### Paso 2: Configurar las Reglas de Seguridad

1. **Accede a las Reglas:**
   - En la página de Firestore, busca la pestaña "Rules" (Reglas)
   - Haz clic en ella

2. **Reemplaza el contenido actual con:**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para la colección de productos
    match /productos/{document=**} {
      // Los usuarios solo pueden leer/escribir sus propios productos
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      
      // Los usuarios autenticados pueden crear nuevos productos
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

3. **Publica las Reglas:**
   - Busca el botón "Publish" (Publicar) en la esquina superior derecha
   - Haz clic en él
   - Espera a que aparezca el mensaje de éxito

### Paso 3: Verifica la Configuración

1. **Recarga la aplicación:**
   - Si está abierta en el navegador, presiona `F5` o `Cmd+R` para recargar

2. **Prueba el CRUD:**
   - Navega a la página de Productos
   - Haz clic en "Nuevo Producto"
   - Ingresa:
     - Código: `TEST001`
     - Descripción: `Producto de prueba`
   - Haz clic en "Crear"
   - Verifica que el producto aparece en la tabla

### Paso 4: Prueba Todas las Funciones

#### Crear:
- ✅ El producto debe aparecer inmediatamente en la tabla

#### Editar:
- Haz clic en "Editar" en la fila del producto
- Cambia el código o descripción
- Haz clic en "Actualizar"
- Los cambios deben reflejarse inmediatamente

#### Eliminar:
- Haz clic en "Eliminar" en la fila del producto
- Confirma en el diálogo
- El producto debe desaparecer de la tabla

## ⚠️ Solución de Problemas

### Problema: Los productos no se guardan
**Solución:**
- Verifica que las reglas de Firestore estén publicadas
- Abre la consola del navegador (F12)
- Busca mensajes de error en rojo
- Verifica que estés autenticado (deberías ver tu email en la página)

### Problema: No puedo ver los productos después de crear
**Solución:**
- Espera 2-3 segundos (Firestore puede tomar tiempo en sincronizar)
- Recarga la página (F5)
- Verifica en Firebase Console → Firestore → Datos que la colección "productos" existe

### Problema: El botón "Eliminar" no funciona
**Solución:**
- Verifica que la descripción del producto no esté vacía
- Intenta crear un nuevo producto y eliminar ese
- Revisa la consola del navegador para ver si hay errores

## 🎯 Verificación en Firebase Console

Para verificar que los datos se guardan correctamente:

1. Ve a Firebase Console → Firestore Database → Data
2. Abre la colección "productos"
3. Deberías ver documentos con estructura:
   ```
   {
     "codigo": "TEST001",
     "descripcion": "Producto de prueba",
     "userId": "[tu-usuario-id]",
     "createdAt": [Timestamp],
     "updatedAt": [Timestamp]
   }
   ```

## 📝 Información Importante

- **Cada usuario solo ve sus propios productos** - Las reglas de Firestore aseguran esto
- **Los datos se sincronizan en tiempo real** - No necesitas recargar la página
- **Los cambios se guardan automáticamente** - No hay botón "Guardar" general
- **Se requiere autenticación** - Debes estar registrado y logueado

## 🚀 ¡Listo!

Si seguiste todos los pasos, el CRUD de productos ya debería estar funcionando completamente. ¡Disfruta! 🎉

---

**Nota:** Si tienes problemas, verifica:
1. Estés logueado correctamente
2. Las reglas de Firestore estén publicadas
3. No haya errores en la consola del navegador (F12 → Console)
4. La colección "productos" exista en Firestore
