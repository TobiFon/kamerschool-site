// app/not-found.tsx or app/[locale]/not-found.tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

export default async function NotFound() {
  // If using next-intl, ensure messages are loaded
  let messages;
  try {
    messages = await getMessages();
  } catch {
    // Fallback for when locale context isn't available
    messages = {};
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <html>
        <body>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <h1>404 - Page Not Found</h1>
            <p>The page you are looking for does not exist.</p>
            <a href="/">Go back home</a>
          </div>
        </body>
      </html>
    </NextIntlClientProvider>
  );
}
