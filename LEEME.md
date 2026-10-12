# Landing · asesoriaarchivistica.co

## Archivos
| Archivo | Función |
|---|---|
| `index.html` | Landing principal |
| `styles.css` | Estilos (oro #EFBF04 / negro #000000) |
| `script.js` | Envía el formulario a Mailerlite y redirige a `gracias.html` |
| `gracias.html` | Confirmación propia tras la suscripción |
| `politica-datos.html` | Política de tratamiento de datos (Ley 1581 de 2012) |
| `CNAME` | Le indica a GitHub Pages que use el dominio asesoriaarchivistica.co |

## 1. Reemplazar los marcadores
Busque `[` en cada archivo (Ctrl+F). Ningún corchete debe quedar publicado.

- `index.html`: [NOMBRE COMPLETO] (2 veces), [NÚMERO] de la T.P. (3 veces), [NOMBRE DEL PODCAST], [UNIVERSIDAD], [AÑOS Y TIPO DE EXPERIENCIA REAL], [SECTORES…], [CIUDAD], [CONFIRMAR MODALIDAD…], [ACCOUNT_ID] y [FORM_ID] (2 formularios).
- `politica-datos.html`: [FECHA DE PUBLICACIÓN], [NOMBRE COMPLETO], [TIPO Y NÚMERO DE DOCUMENTO O NIT], [CIUDAD].

Si un dato de credenciales no existe, borre esa línea `<li>` en lugar de inventarlo.

## 2. Conectar Mailerlite
1. **Campo de consentimiento:** Suscriptores → Campos → crear campo de texto llamado `autorizacion_datos`. Así queda registrada la prueba de la autorización de cada suscriptor.
2. **Formulario:** Formularios → Formularios incrustados → Crear. Asígnele un grupo (por ejemplo, "Boletín").
3. **Doble opt-in:** active la confirmación por correo en la configuración del formulario.
4. **Obtener los IDs:** en el formulario, abra la opción de código HTML. En la etiqueta `<form>` aparece una dirección como esta:
   `https://assets.mailerlite.com/jsonp/1234567/forms/987654321/subscribe`
   El primer número es `ACCOUNT_ID` y el segundo es `FORM_ID`. Péguelos en los dos formularios de `index.html`.

## 3. Publicar en GitHub Pages
1. Cree un repositorio **público** (GitHub Pages gratuito exige repositorio público), por ejemplo `asesoriaarchivistica.co`.
2. Suba todos los archivos de esta carpeta a la raíz del repositorio, incluido `CNAME`.
3. Settings → Pages → Source: *Deploy from a branch* → rama `main`, carpeta `/ (root)`.
4. La configuración de DNS en Porkbun y el HTTPS se detallan en la Fase 3.

## 4. Prueba antes de anunciarla
- Suscríbase con un correo propio. Debe ver `gracias.html` y recibir el correo de confirmación.
- Compruebe en Mailerlite que el suscriptor aparece con `autorizacion_datos = Si`.
- Si después de enviar no llega nada, revise los IDs. El navegador no puede mostrar la respuesta de Mailerlite, así que la prueba real es el correo de confirmación.
