// Fallback content used until you save something in the admin panel.
module.exports = {
  packages: [
    { id: "short-basic", service: "short", name: "Basic Short", name_de: "Basis-Short", price: 5, items: ["Basic cuts", "Simple subtitles", "Basic sound effects"], items_de: ["Einfache Schnitte", "Einfache Untertitel", "Einfache Soundeffekte"], hot: false, active: true },
    { id: "short-advanced", service: "short", name: "Advanced Short", name_de: "Erweiterter Short", price: 10, items: ["More detailed editing", "Animated captions", "Sound effects", "Better pacing"], items_de: ["Detaillierterer Schnitt", "Animierte Untertitel", "Soundeffekte", "Besseres Tempo"], hot: true, active: true },
    { id: "short-premium", service: "short", name: "Premium Short", name_de: "Premium-Short", price: 15, items: ["Detailed editing", "Advanced captions", "More effects", "Polished final result"], items_de: ["Detaillierter Schnitt", "Erweiterte Untertitel", "Mehr Effekte", "Ausgefeiltes Endergebnis"], hot: false, active: true },
    { id: "long-basic", service: "long", name: "Basic Video", name_de: "Basis-Video", price: 15, items: ["Up to 5 minutes", "Basic cuts", "Simple editing"], items_de: ["Bis zu 5 Minuten", "Einfache Schnitte", "Einfacher Schnitt"], hot: false, active: true },
    { id: "long-standard", service: "long", name: "Standard Video", name_de: "Standard-Video", price: 25, items: ["5–10 minutes", "More detailed editing", "Sound effects", "Background music", "Better pacing"], items_de: ["5–10 Minuten", "Detaillierterer Schnitt", "Soundeffekte", "Hintergrundmusik", "Besseres Tempo"], hot: true, active: true },
    { id: "long-premium", service: "long", name: "Premium Video", name_de: "Premium-Video", price: 40, items: ["10–20 minutes", "Detailed editing", "Advanced cuts", "Sound effects", "More polished editing"], items_de: ["10–20 Minuten", "Detaillierter Schnitt", "Erweiterte Schnitte", "Soundeffekte", "Ausgefeilterer Schnitt"], hot: false, active: true },
  ],
  projects: [
    { title: "Valorant Montage Short", cat: "Valorant", type: "Short", dur: "", youtubeId: "7B44hmiakzg", file: "", thumb: "" },
    { title: "Valorant Montage Short", cat: "Valorant", type: "Short", dur: "", youtubeId: "JgmB7NDMo60", file: "", thumb: "" },
    { title: "Minecraft Server Advertisement Short", cat: "Minecraft", type: "Short", dur: "", youtubeId: "NKDW2TMC3wQ", file: "", thumb: "" },
    { title: "Minecraft Cheater Caught Short", cat: "Minecraft", type: "Short", dur: "", youtubeId: "wkA3Ethj0Mo", file: "", thumb: "" },
    { title: "Discord Bot Advertisement Short", cat: "Other", type: "Short", dur: "0:20", youtubeId: "", file: "videos/discord-bot-ad.mp4", thumb: "img/discord-bot-ad-poster.jpg" },
    { title: "Minecraft Trailer (1 Minute)", cat: "Minecraft", type: "Video", dur: "1:00", youtubeId: "xJP4jjOpkiQ", file: "", thumb: "" },
    { title: "Minecraft Long-Form Video", cat: "Minecraft", type: "Video", dur: "", youtubeId: "wGCyaZ7YLY0", file: "", thumb: "" },
  ],
  about: { heading: "Hey, I’m Tim.", heading_de: "Hey, ich bin Tim.", paragraphs_de: ["Hey! Ich bin Tim, auch bekannt als Pegasus2912.", "Ich schneide seit 2021 Videos und habe mich auf Gaming-Inhalte spezialisiert, besonders Valorant und Minecraft.", "Ich mache gerne unterhaltsame Short-Form-Inhalte und gut geschnittene Long-Form-Videos.", "Ich verstehe Deutsch und Englisch, das macht die Zusammenarbeit mit internationalen Kunden einfach."], paragraphs: ["Hey! I’m Tim, also known as Pegasus2912.", "I’ve been editing videos since 2021 and specialize in gaming content, especially Valorant and Minecraft.", "I enjoy creating entertaining short-form content and well-edited long-form videos.", "I understand both German and English, making communication with international clients easy."], facts: { name: "Tim Berschinski", age: "22", since: "2021", languages: "German & English", languages_de: "Deutsch & Englisch" } },
  contact: { email: "Info@statelight.de", discord: "Pegasus2912", youtube: "", tiktok: "" },
};
