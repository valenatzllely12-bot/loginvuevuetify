## Configuración de Firestore Security Rules

Para que la funcionalidad de CRUD de productos funcione correctamente, necesitas configurar las reglas de seguridad en Firestore.

### Pasos para configurar las reglas en Firebase Console:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto "login-d7825"
3. Ve a **Firestore Database** en el menú izquierdo
4. Haz clic en la pestaña **Rules**
5. Reemplaza el contenido con las siguientes reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users on their own data
    match /productos/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

6. Haz clic en **Publish** para guardar las reglas

### Explicación de las reglas:
- `allow create`: Permite crear documentos si el usuario está autenticado y el userId coincide con su UID
- `allow read, write`: Permite leer y escribir solo en documentos donde el userId coincide con el UID del usuario autenticado

Después de configurar estas reglas, el CRUD de productos debería funcionar correctamente.

## Verificar que funciona:

1. Crea un nuevo producto
2. Verifica que aparezca en la tabla
3. Intenta editar el producto
4. Intenta eliminar el producto

Todos los cambios deben sincronizarse en Firestore en tiempo real.
