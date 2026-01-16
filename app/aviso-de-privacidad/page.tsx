import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Aviso de Privacidad - NEXO ERP",
  description: "Aviso de privacidad de NEXO ERP.",
}

export default function PrivacyNoticePage() {
  const today = new Date().toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Aviso de Privacidad - NEXO ERP</h1>
        <p className="text-sm text-muted-foreground mb-8">?ltima actualizaci?n: {today}</p>

        <div className="space-y-8 text-sm md:text-base leading-relaxed text-foreground/90">
          <p>
            En NEXO ERP, valoramos y protegemos la privacidad de nuestros usuarios, clientes y prospectos.
            El presente Aviso de Privacidad describe c?mo recopilamos, usamos, almacenamos y protegemos sus
            datos personales, de conformidad con la Ley Federal de Protecci?n de Datos Personales en
            Posesi?n de los Particulares (LFPDPPP) y su reglamento.
          </p>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">1. Responsable del tratamiento de los datos personales</h2>
            <p>NEXO ERP, plataforma de gesti?n empresarial, es responsable del uso y protecci?n de sus datos personales.</p>
            <p>Correo de contacto: info@momentumconsulting.mx</p>
            <p>Ubicaci?n: M?xico</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">2. Datos personales que recabamos</h2>
            <p>
              Los datos personales que podemos recabar a trav?s de nuestro sitio web, formularios, WhatsApp,
              demos y uso de la plataforma incluyen, de manera enunciativa m?s no limitativa:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nombre completo</li>
              <li>Empresa o raz?n social</li>
              <li>Correo electr?nico</li>
              <li>N?mero telef?nico</li>
              <li>Informaci?n de contacto comercial</li>
              <li>Informaci?n relacionada con procesos operativos, administrativos o empresariales</li>
              <li>Datos de uso de la plataforma (m?dulos utilizados, actividad, registros)</li>
            </ul>
            <p>NEXO ERP no recaba datos personales sensibles de forma intencional.</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">3. Finalidades del tratamiento de los datos</h2>
            <p>Los datos personales ser?n utilizados para las siguientes finalidades:</p>
            <p className="font-semibold">Finalidades primarias (necesarias):</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Contactarlo para agendar y brindar demostraciones de NEXO ERP</li>
              <li>Proveer el acceso y funcionamiento de la plataforma ERP</li>
              <li>Gestionar cuentas, usuarios y m?dulos del sistema</li>
              <li>Brindar soporte t?cnico y atenci?n al cliente</li>
              <li>Enviar informaci?n relacionada con el servicio contratado</li>
              <li>Cumplir obligaciones legales y contractuales</li>
            </ul>
            <p className="font-semibold">Finalidades secundarias (opcionales):</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Enviar informaci?n comercial, promociones o novedades de NEXO ERP</li>
              <li>Mejorar la experiencia del usuario y el desarrollo de funcionalidades</li>
              <li>An?lisis interno para optimizaci?n de procesos y servicios</li>
            </ul>
            <p>Si no desea que sus datos se utilicen para finalidades secundarias, puede solicitarlo en cualquier momento.</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">4. Transferencia de datos personales</h2>
            <p>NEXO ERP no vende ni renta sus datos personales.</p>
            <p>Los datos podr?n ser compartidos ?nicamente con:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Proveedores tecnol?gicos necesarios para la operaci?n del sistema</li>
              <li>Servicios de mensajer?a (como WhatsApp) para contacto solicitado por el usuario</li>
              <li>Autoridades competentes cuando sea legalmente requerido</li>
            </ul>
            <p>En todos los casos, se asegura la confidencialidad y protecci?n de la informaci?n.</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">5. Derechos ARCO (Acceso, Rectificaci?n, Cancelaci?n y Oposici?n)</h2>
            <p>Usted tiene derecho a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Acceder a sus datos personales</li>
              <li>Rectificarlos si son inexactos</li>
              <li>Cancelarlos cuando considere que no son necesarios</li>
              <li>Oponerse al tratamiento de los mismos</li>
            </ul>
            <p>Para ejercer sus derechos ARCO, puede enviar una solicitud al correo:</p>
            <p>privacidad@nexoerp.com</p>
            <p>La solicitud deber? incluir:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nombre del titular</li>
              <li>Medio de contacto</li>
              <li>Derecho que desea ejercer</li>
              <li>Identificaci?n del titular</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">6. Uso de cookies y tecnolog?as similares</h2>
            <p>
              Nuestro sitio web puede utilizar cookies y tecnolog?as similares para mejorar la experiencia
              del usuario, analizar el uso del sitio y optimizar nuestros servicios.
            </p>
            <p>El usuario puede deshabilitar las cookies desde su navegador.</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">7. Medidas de seguridad</h2>
            <p>
              NEXO ERP implementa medidas administrativas, t?cnicas y f?sicas para proteger los datos
              personales contra da?o, p?rdida, alteraci?n, destrucci?n o uso no autorizado.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">8. Cambios al aviso de privacidad</h2>
            <p>
              NEXO ERP se reserva el derecho de modificar este Aviso de Privacidad en cualquier momento.
              Las modificaciones ser?n publicadas en esta misma secci?n del sitio web.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">9. Consentimiento</h2>
            <p>
              Al proporcionar sus datos personales a trav?s de nuestro sitio web, formularios, WhatsApp o
              al utilizar la plataforma NEXO ERP, usted acepta este Aviso de Privacidad.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
