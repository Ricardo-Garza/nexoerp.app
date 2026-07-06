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
        <p className="text-sm text-muted-foreground mb-8">Última actualización: {today}</p>

        <div className="space-y-8 text-sm md:text-base leading-relaxed text-foreground/90">
          <p>
            En NEXO ERP, valoramos y protegemos la privacidad de nuestros usuarios, clientes y prospectos.
            El presente Aviso de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos sus
            datos personales, de conformidad con la Ley Federal de Protección de Datos Personales en
            Posesión de los Particulares (LFPDPPP) y su reglamento.
          </p>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">1. Responsable del tratamiento de los datos personales</h2>
            <p>NEXO ERP, plataforma de gestión empresarial, es responsable del uso y protección de sus datos personales.</p>
            <p>Correo de contacto: info@momentumconsulting.mx</p>
            <p>Ubicación: México</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">2. Datos personales que recabamos</h2>
            <p>
              Los datos personales que podemos recabar a través de nuestro sitio web, formularios, WhatsApp,
              demostraciones y uso de la plataforma incluyen, de manera enunciativa mas no limitativa:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nombre completo</li>
              <li>Empresa o razón social</li>
              <li>Correo electrónico</li>
              <li>Número telefónico</li>
              <li>Información de contacto comercial</li>
              <li>Información relacionada con procesos operativos, administrativos o empresariales</li>
              <li>Datos de uso de la plataforma, como módulos utilizados, actividad y registros</li>
            </ul>
            <p>NEXO ERP no recaba datos personales sensibles de forma intencional.</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">3. Finalidades del tratamiento de los datos</h2>
            <p>Los datos personales serán utilizados para las siguientes finalidades:</p>
            <p className="font-semibold">Finalidades primarias necesarias:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Contactarlo para agendar y brindar demostraciones de NEXO ERP</li>
              <li>Proveer el acceso y funcionamiento de la plataforma ERP</li>
              <li>Gestionar cuentas, usuarios y módulos del sistema</li>
              <li>Brindar soporte técnico y atención al cliente</li>
              <li>Enviar información relacionada con el servicio contratado</li>
              <li>Cumplir obligaciones legales y contractuales</li>
            </ul>
            <p className="font-semibold">Finalidades secundarias opcionales:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Enviar información comercial, promociones o novedades de NEXO ERP</li>
              <li>Mejorar la experiencia del usuario y el desarrollo de funcionalidades</li>
              <li>Análisis interno para optimización de procesos y servicios</li>
            </ul>
            <p>Si no desea que sus datos se utilicen para finalidades secundarias, puede solicitarlo en cualquier momento.</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">4. Transferencia de datos personales</h2>
            <p>NEXO ERP no vende ni renta sus datos personales.</p>
            <p>Los datos podrán ser compartidos únicamente con:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Proveedores tecnológicos necesarios para la operación del sistema</li>
              <li>Servicios de mensajería, como WhatsApp, para contacto solicitado por el usuario</li>
              <li>Autoridades competentes cuando sea legalmente requerido</li>
            </ul>
            <p>En todos los casos, se asegura la confidencialidad y protección de la información.</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">5. Derechos ARCO</h2>
            <p>Usted tiene derecho a acceder, rectificar, cancelar u oponerse al tratamiento de sus datos personales.</p>
            <p>Para ejercer sus derechos ARCO, puede enviar una solicitud al correo:</p>
            <p>privacidad@nexoerp.com</p>
            <p>La solicitud deberá incluir nombre del titular, medio de contacto, derecho que desea ejercer e identificación del titular.</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">6. Uso de cookies y tecnologías similares</h2>
            <p>
              Nuestro sitio web puede utilizar cookies y tecnologías similares para mejorar la experiencia del usuario,
              analizar el uso del sitio y optimizar nuestros servicios.
            </p>
            <p>El usuario puede deshabilitar las cookies desde su navegador.</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">7. Medidas de seguridad</h2>
            <p>
              NEXO ERP implementa medidas administrativas, técnicas y físicas para proteger los datos personales contra
              daño, pérdida, alteración, destrucción o uso no autorizado.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">8. Cambios al aviso de privacidad</h2>
            <p>
              NEXO ERP se reserva el derecho de modificar este Aviso de Privacidad en cualquier momento. Las
              modificaciones serán publicadas en esta misma sección del sitio web.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">9. Consentimiento</h2>
            <p>
              Al proporcionar sus datos personales a través de nuestro sitio web, formularios, WhatsApp o al utilizar la
              plataforma NEXO ERP, usted acepta este Aviso de Privacidad.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
