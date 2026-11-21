/* German/English switch. English is the source text; German is looked up by exact string. */
(function () {
  const D = {
    "About": "Über mich", "Services": "Leistungen", "Work": "Portfolio", "Pricing": "Preise", "Process": "Ablauf", "Contact": "Kontakt", "Login": "Anmelden", "Account": "Konto",
    "Your Gameplay.": "Dein Gameplay.", "My Editing.": "Mein Schnitt.", "Your Growth.": "Dein Wachstum.",
    "I turn your gameplay into engaging videos, entertaining shorts and content your audience loves.": "Ich mache aus deinem Gameplay packende Videos, unterhaltsame Shorts und Inhalte, die dein Publikum liebt.",
    "Specialized in Valorant & Minecraft video editing.": "Spezialisiert auf Valorant- und Minecraft-Videoschnitt.", "Explore My Work": "Meine Arbeiten ansehen", "Order Now": "Jetzt bestellen",
    "About Me": "Über mich", "Hey, I’m Tim.": "Hey, ich bin Tim.", "Age": "Alter", "Editing since": "Im Schnitt seit", "Languages": "Sprachen", "German & English": "Deutsch & Englisch",
    "Hey! I’m Tim, also known as Pegasus2912.": "Hey! Ich bin Tim, auch bekannt als Pegasus2912.",
    "I’ve been editing videos since 2021 and specialize in gaming content, especially Valorant and Minecraft.": "Ich schneide seit 2021 Videos und habe mich auf Gaming-Inhalte spezialisiert, besonders Valorant und Minecraft.",
    "I enjoy creating entertaining short-form content and well-edited long-form videos.": "Ich mache gerne unterhaltsame Short-Form-Inhalte und gut geschnittene Long-Form-Videos.",
    "I understand both German and English, making communication with international clients easy.": "Ich verstehe Deutsch und Englisch, das macht die Zusammenarbeit mit internationalen Kunden einfach.",
    "What I can edit for you": "Was ich für dich schneide", "My Work": "Meine Arbeiten", "All": "Alle", "Other": "Andere", "Price": "Preise", "Why Choose Me?": "Warum ich?", "What you can expect": "Das kannst du erwarten",
    "How It Works": "So funktioniert’s", "Four simple steps": "Vier einfache Schritte", "Let's Create Something Great!": "Lass uns etwas Großartiges schaffen!",
    "Have a project in mind? Looking for someone to edit your Valorant or Minecraft content? Feel free to contact me!": "Du hast ein Projekt? Du suchst jemanden für deinen Valorant- oder Minecraft-Content? Schreib mir einfach!",
    "Navigate": "Navigation", "Connect": "Kontakt", "Privacy Policy": "Datenschutz",
    "Choose a service": "Service wählen", "Choose a package": "Paket wählen", "Your project": "Dein Projekt", "Review & pay": "Prüfen & bezahlen", "Short-Form Editing": "Short-Form-Schnitt", "Long-Form Editing": "Long-Form-Schnitt",
    "← Back": "← Zurück", "Review order →": "Bestellung prüfen →", "Your name": "Dein Name", "Email address": "E-Mail-Adresse", "Video type": "Videotyp", "Desired video length (e.g. 45 seconds)": "Gewünschte Videolänge (z. B. 45 Sekunden)",
    "Game": "Spiel", "Reference videos or links (https only, one per line, optional)": "Referenzvideos oder Links (nur https, ein Link pro Zeile, optional)", "Editing preferences (style, music, pacing; optional)": "Schnitt-Wünsche (Stil, Musik, Tempo; optional)",
    "Subtitles / language": "Untertitel / Sprache", "Describe exactly what you want (German or English)": "Beschreibe genau, was du möchtest (Deutsch oder Englisch)",
    "Gameplay edit": "Gameplay-Schnitt", "Highlights": "Highlights", "Montage": "Montage", "Trailer": "Trailer", "Advertisement": "Werbevideo", "No subtitles": "Keine Untertitel", "German": "Deutsch", "English": "Englisch",
    " I have read the ": " Ich habe die ", " and agree that my details are used to process my order.": " gelesen und stimme zu, dass meine Angaben zur Bearbeitung meiner Bestellung verwendet werden.",
    "Service": "Service", "Package": "Paket", "Name": "Name", "Email": "E-Mail", "Length": "Länge", "Subtitles": "Untertitel", "References": "Referenzen", "Preferences": "Wünsche", "Instructions": "Anweisungen",
    "Pay securely with Stripe": "Sicher mit Stripe bezahlen", "Payment is handled by Stripe. Card details never reach this website.": "Die Zahlung läuft über Stripe. Kartendaten erreichen diese Website nie.",
    "Connecting to secure checkout…": "Verbindung zur sicheren Kasse …", "Online ordering is not available right now. Please contact me by email.": "Online-Bestellung ist gerade nicht verfügbar. Bitte kontaktiere mich per E-Mail.",
    "Please check your details and try again.": "Bitte prüfe deine Angaben und versuche es erneut.", "Too many requests. Please try again later.": "Zu viele Anfragen. Bitte versuche es später erneut.", "Close order": "Bestellung schließen",
    "← Back to website": "← Zur Website", "Log in": "Anmelden", "Register": "Registrieren", "Log out": "Abmelden", "Create account": "Konto erstellen", "Password": "Passwort", "Password (min. 10 characters)": "Passwort (mind. 10 Zeichen)",
    "Forgot password?": "Passwort vergessen?", "Send reset link": "Link zum Zurücksetzen senden", "My account": "Mein Konto", "My orders": "Meine Bestellungen", "Messages": "Nachrichten", "Conversation": "Unterhaltung",
    "Check your email to verify your account.": "Bitte bestätige dein Konto über die E-Mail, die wir dir geschickt haben.", "Email verified. You can now log in.": "E-Mail bestätigt. Du kannst dich jetzt anmelden.",
    "If this email is registered, a reset link has been sent.": "Falls diese E-Mail registriert ist, wurde ein Link zum Zurücksetzen gesendet.", "Set a new password": "Neues Passwort festlegen", "Save password": "Passwort speichern",
    "Password updated. Please log in.": "Passwort geändert. Bitte melde dich an.", "This link is invalid or has expired.": "Dieser Link ist ungültig oder abgelaufen.", "You have been logged out.": "Du wurdest abgemeldet.",
    "Invalid email or password.": "E-Mail oder Passwort ungültig.", "Please verify your email address first.": "Bitte bestätige zuerst deine E-Mail-Adresse.", "Please log in.": "Bitte melde dich an.",
    "You have no orders yet.": "Du hast noch keine Bestellungen.", "Send": "Senden", "Message (German or English)": "Nachricht (Deutsch oder Englisch)", "Messaging opens after payment is confirmed.": "Nachrichten sind nach bestätigter Zahlung möglich.",
    "No messages yet.": "Noch keine Nachrichten.", "You": "Du", "Order": "Bestellung", "Status": "Status", "Payment": "Zahlung", "paid": "bezahlt", "unpaid": "unbezahlt", "new": "neu", "Save": "Speichern", "Saved.": "Gespeichert.",
    "Language": "Sprache", "Change password": "Passwort ändern", "New password (min. 10 characters)": "Neues Passwort (mind. 10 Zeichen)", "Account details": "Kontodaten", "Please check your details (password: at least 10 characters).": "Bitte prüfe deine Angaben (Passwort: mindestens 10 Zeichen).",
    "Awaiting Payment": "Zahlung ausstehend", "Paid": "Bezahlt", "Confirmed": "Bestätigt", "In Progress": "In Bearbeitung", "Waiting for Customer Response": "Wartet auf deine Antwort", "Completed": "Abgeschlossen", "Cancelled": "Storniert",
    "Message must be 1-2000 characters.": "Die Nachricht muss 1–2000 Zeichen lang sein.", "I have read the Privacy Policy": "Ich habe die Datenschutzerklärung gelesen", "Order now": "Jetzt bestellen", "Pegasus2912 account": "Pegasus2912-Konto",
  };
  const R = [[/^Step (\d) of 4$/, "Schritt $1 von 4"], [/^Total: (.+)$/, "Gesamt: $1"]];
  const lang = (localStorage.getItem("lang") || (navigator.language || "en").slice(0, 2)).toLowerCase() === "de" ? "de" : "en";
  const T = (s) => { if (lang !== "de" || typeof s !== "string") return s; if (D[s]) return D[s]; for (const [r, x] of R) if (r.test(s)) return s.replace(r, x); return s; };
  const apply = (root) => { if (lang !== "de") return; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), ns = []; while (w.nextNode()) ns.push(w.currentNode); ns.forEach((n) => { const t = n.nodeValue.trim(); if (t && D[t]) n.nodeValue = n.nodeValue.replace(t, D[t]); }); };
  document.documentElement.lang = lang;
  window.T = T; window.I18N = { lang, T, apply, set(l) { localStorage.setItem("lang", l); location.reload(); } };
})();
