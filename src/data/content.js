// Copy for the site. Projects marked placeholder: true are stand-ins until BANDE supplies more of its own work.
export const content = {
  tr: {
    meta: {
      title: "BANDE Mimarlık — Pikselden mekâna",
      description: "Bursa merkezli mimarlık ofisi. BIM, restorasyon, rölöve, kentsel tasarım ve planlama. 2015'ten beri her yapıyı önce veriyle, sonra taşla düşünüyoruz."
    },
    ui: { menu: "Menü", close: "Kapat", contact: "İletişim", sound: "Ses", soundOn: "Ses açık", scroll: "Kaydır", back: "Arşive dön", view: "Projeyi aç", loading: "Yükleniyor", next: "Sonraki proje", chapter: "Bölüm" },
    chapters: [
      {
        id: "origin", label: "PIKSELDEN MEKANA",
        title: ["Pikselden", "mekâna."],
        body: "2015'te Bursa'da başladık. Logomuzdaki her kare bir taş blok; her blok, bir gün bir yapının parçası olacak kadar ciddiye alınır.",
        meta: ["BURSA 40.22N 28.98E", "EST. 2015"]
      },
      {
        id: "urban", label: "KENTSEL OLCEK",
        title: ["Önce kent,", "sonra bina."],
        body: "Bir yapı sokağa, sokak mahalleye, mahalle kente bağlanır. Planı ve tasarımı aynı masada çizeriz; yoğunluk de boşluk da hesabın parçasıdır.",
        meta: ["OLCEK 1:5000", "MASTER PLAN"]
      },
      {
        id: "building", label: "KONUT VE KARMA YAPI",
        title: ["Her kata", "bir bahçe."],
        body: "Basamaklanan teraslar, dükkânla başlayıp çatıda biten bir gündelik hayat. Konut ve karma kullanımda her seviyeye güneş, yeşil ve bir komşu düşer.",
        meta: ["KONUT + KARMA", "12 TERAS"]
      },
      {
        id: "bim", label: "BIM KATMANLARI",
        title: ["Her bloğun", "bir kimliği", "var."],
        body: "Duvar yalnızca çizgi değildir; malzemesi, maliyeti, ömrü vardır. Mimari, statik ve tesisatı tek modelde buluşturur, şantiyeye sürpriz bırakmayız.",
        meta: ["LOD 300", "IFC 4.0", "CAKISMA 0"]
      },
      {
        id: "survey", label: "ROLOVE VE RESTORASYON",
        title: ["Dokunmadan", "önce ölç."],
        body: "Lazer tarayıcı bir han cephesini milyonlarca noktaya çevirir. Mevcudu bütün çıplaklığıyla bilince, eksik kalanı yerine, aslına sadık biçimde koyarız.",
        meta: ["LAZER TARAMA", "4.2M NOKTA", "HAN CEPHESI"]
      },
      {
        id: "archive", label: "SECILMIS ISLER",
        title: ["Seçilmiş", "işler."],
        body: "On yıla yakın emeğin kısa bir derlemesi. Fotoğrafların arasında dolaşın, bir projeye yaklaşın, kapıyı aralayın.",
        meta: ["08 PROJE", "2015-2026"]
      },
      {
        id: "contact", label: "ILETISIM",
        title: ["Bir kahve", "içelim mi?"],
        body: "Nilüfer'deki masamız her zaman bir proje daha kaldırır. Önce bir konuşalım; kalanı çizgiyle, veriyle ve taşla gelir.",
        meta: ["BURSA 40.22N 28.98E", "EST. 2015"]
      }
    ],
    services: ["BIM Danışmanlığı", "HBIM · Miras BIM", "Rölöve ve Lazer Tarama", "Restorasyon", "Kentsel Tasarım", "Kentsel Planlama", "Konut ve Karma Kullanım", "Autodesk Yetkili Eğitim Merkezi"],
    projects: [
      { slug: "tarakli-kent-meydani", img: "tar-4", title: "Taraklı Kent Meydanı", place: "Taraklı, Sakarya", year: "2014–2016", type: "Kentsel Tasarım, Peyzaj", area: "3.350 m²", role: "Konsept, uygulama projesi, şantiye denetimi", award: "Turgut Cansever Uluslararası Mimarlık Ödülü, Yapı Ödülü (2019) · Arkitera Türkiye Mimarlık Yıllığı (2015)", photo: "Çetin Aykırı, Emrah Önal, Mesiha Meryem Uzun, Murat Temiz, Şahin Akı", summary: "1950'lere dek çarşının parçası olan park, gelişigüzel beton duvarlardan arındırılıp tarihî dokuya açılan bir meydana dönüştü. Yıkılan dükkânların izleri granit zeminde malzeme farkıyla okunuyor; esnafın adları taşa kazındı.", gallery: ["tar-4", "tar-1", "tar-2", "tar-3"] },
      { slug: "akcakoca-bey-camii", img: "akc-2", title: "Akçakoca Bey Camii ve Çevresi", place: "Kandıra, Kocaeli", year: "2013–2015", type: "Cami, Peyzaj, Anıt Onarımı", area: "225 m² · 34.275 m² arazi", role: "Konsept, uygulama projesi, şantiye denetimi", award: "Turgut Cansever Uluslararası Mimarlık Ödülü, Sergi ve Kitap Seçkisi (2019) · Ulusal Mimarlık Ödülleri Sergisi (2018) · Arkitera Yıllığı (2016)", photo: "Y. Burak Dolu, Gülnar Ocakdan", summary: "Karadeniz'e bakan Babatepe'deki türbenin çevresi araç yollarından arındırıldı. Yeni cami, unutulmaya yüz tutmuş çandı ahşap yapım tekniği araştırılarak erken Osmanlı tipolojisinin çağdaş bir yorumu olarak tasarlandı.", gallery: ["akc-2", "akc-1", "akc-3", "akc-4"] },
      { slug: "osman-hamdi-bey-evi", img: "ohb-1", title: "Osman Hamdi Bey Evi ve Ek Binası", place: "Eskihisar, Gebze, Kocaeli", year: "2014–2021", type: "Rölöve, Restorasyon, Müze", area: "550 m² · 2.400 m² arazi", role: "Rölöve, restitüsyon, restorasyon, yeniden kullanım", summary: "Osman Hamdi Bey'in 1884'te yaptırdığı köşk ve ek binası rölöve ve restitüsyonla belgelendi. Köşk ev-müze olarak özgün işlevini korurken ek bina galeri, atölye ve müze birimleriyle yeniden işlevlendirildi.", gallery: ["ohb-1", "ohb-2", "ohb-3", "ohb-4"] },
      { placeholder: true, slug: "nilufer-carsi-bloklari", img: "p07", title: "Çarşı Blokları", place: "Nilüfer, Bursa", year: "2023", type: "Karma Kullanım", area: "18.400 m²", role: "Tasarım, BIM", summary: "Zemini dükkân, üstü konut olan orta katlı bir sokak dizisi. Bloklar aralarında yürüyüş akslarını açık bırakır; cadde, yapının dışında değil içinde başlar.", gallery: ["p07", "p09", "p04"] },
      { placeholder: true, slug: "gursu-teras-konutlari", img: "p10", title: "Teras Konutları", place: "Gürsu, Bursa", year: "2025", type: "Konut", area: "9.200 m²", role: "Tasarım, Kentsel Tasarım", summary: "Yamaca oturan, her dairesine bir bahçe düşen basamaklı konut yapısı. Yeşil cephe yalnızca süs değil, yazın gölge, kışın rüzgâr perdesi.", gallery: ["p10", "p02", "p13"] },
      { placeholder: true, slug: "yildirim-bahce-blogu", img: "p02", title: "Bahçe Bloğu", place: "Yıldırım, Bursa", year: "2018", type: "Konut", area: "6.700 m²", role: "Tasarım, Uygulama", summary: "Beş katlı beyaz bir blok; her balkon bir saksı değil, küçük bir bahçe. Cephedeki bitki dizisi apartmanı mahalleye yumuşatarak bağlar.", gallery: ["p02", "p10", "p03"] },
      { placeholder: true, slug: "osmangazi-kultur-atolyesi", img: "p15", title: "Kültür Atölyesi", place: "Osmangazi, Bursa", year: "2026", type: "Kültür Yapısı", area: "4.300 m²", role: "Tasarım, BIM", summary: "Toprak kırmızısı heykelsi bir kütle; içinde sergi, atölye ve küçük bir salon. Bursa'nın kiremit ve tuğla belleğine çağdaş bir selam.", gallery: ["p15", "p13", "p14"] },
      { placeholder: true, slug: "mudanya-zeytin-evi", img: "p06", title: "Zeytin Evi", place: "Mudanya, Bursa", year: "2020", type: "Konut", area: "420 m²", role: "Tasarım, Uygulama", summary: "Zeytin ağaçlarının arasına yerleşmiş, koyu konsol saçaklı bir villa. Saçak yazın güneşi keser, akşam ışığı içeri bırakır.", gallery: ["p06", "p12", "p01"] }
    ],
    contact: {
      heading: ["Birlikte", "çizelim."],
      address: ["Cadde224 Sitesi, Fatih Sultan Mehmet Blv. No:41/A", "Workinton · 16140 Nilüfer / Bursa"],
      email: "info@bandemimarlik.com",
      phone: "+90 224 451 33 63",
      note: "Autodesk Yetkili Eğitim Merkezi · BIM ve Miras BIM uzmanlığı",
      social: [["Instagram", "https://www.instagram.com/bandearchitects/"], ["YouTube", "https://www.youtube.com/@bandearchitects1956"]],
      credit: "© 2026 BANDE Mimarlık Mühendislik Ltd. Şti."
    }
  },
  en: {
    meta: {
      title: "BANDE Architects — From pixel to place",
      description: "Architecture office in Bursa, Turkey. BIM, restoration, measured survey, urban design and planning. Since 2015 we think in data first, then in stone."
    },
    ui: { menu: "Menu", close: "Close", contact: "Contact", sound: "Sound", soundOn: "Sound on", scroll: "Scroll", back: "Back to archive", view: "Open project", loading: "Loading", next: "Next project", chapter: "Chapter" },
    chapters: [
      {
        id: "origin", label: "FROM PIXEL TO PLACE",
        title: ["From pixel", "to place."],
        body: "We began in Bursa in 2015. Every square in our logo is a block of stone, and every block is taken seriously enough to become part of a building.",
        meta: ["BURSA 40.22N 28.98E", "EST. 2015"]
      },
      {
        id: "urban", label: "URBAN SCALE",
        title: ["City first,", "building next."],
        body: "A building belongs to a street, a street to a district, a district to a city. We draw plan and design at the same table; density and emptiness are both part of the sum.",
        meta: ["SCALE 1:5000", "MASTER PLAN"]
      },
      {
        id: "building", label: "HOUSING AND MIXED USE",
        title: ["A garden", "on every floor."],
        body: "Stepped terraces, an everyday life that starts at the shop and ends on the roof. In housing and mixed use, every level gets sun, green and a neighbour.",
        meta: ["HOUSING + MIXED", "12 TERRACES"]
      },
      {
        id: "bim", label: "BIM LAYERS",
        title: ["Every block", "has an", "identity."],
        body: "A wall is more than a line; it has a material, a cost, a lifespan. Architecture, structure and services meet in one model, so the site holds no surprises.",
        meta: ["LOD 300", "IFC 4.0", "CLASHES 0"]
      },
      {
        id: "survey", label: "SURVEY AND RESTORATION",
        title: ["Measure", "before you", "touch."],
        body: "A laser scanner turns a han facade into millions of points. Once we know what exists, down to the last stone, we put back what is missing, true to the original.",
        meta: ["LASER SCAN", "4.2M POINTS", "HAN FACADE"]
      },
      {
        id: "archive", label: "SELECTED WORKS",
        title: ["Selected", "works."],
        body: "A short collection from nearly a decade of work. Wander between the photographs, step closer to a project, push the door open.",
        meta: ["08 PROJECTS", "2015-2026"]
      },
      {
        id: "contact", label: "CONTACT",
        title: ["Shall we", "have coffee?"],
        body: "Our table in Nilüfer always has room for one more project. Let us talk first; the lines, the data and the stone will follow.",
        meta: ["BURSA 40.22N 28.98E", "EST. 2015"]
      }
    ],
    services: ["BIM Consultancy", "HBIM · Heritage BIM", "Measured Survey and Laser Scanning", "Restoration", "Urban Design", "Urban Planning", "Housing and Mixed Use", "Autodesk Authorized Training Center"],
    projects: [
      { slug: "tarakli-kent-meydani", img: "tar-4", title: "Taraklı Town Square", place: "Taraklı, Sakarya", year: "2014–2016", type: "Urban Design, Landscape", area: "3,350 m²", role: "Concept, detailed design, site supervision", award: "Turgut Cansever International Architecture Award, Building Award (2019) · Arkitera Turkey Architecture Annual (2015)", photo: "Çetin Aykırı, Emrah Önal, Mesiha Meryem Uzun, Murat Temiz, Şahin Akı", summary: "Part of the bazaar until the 1950s, the park was cleared of ad-hoc concrete walls and opened up to the historic fabric as a square. The traces of demolished shops read on the granite floor through material change, with the tradesmen's names carved into the stone.", gallery: ["tar-4", "tar-1", "tar-2", "tar-3"] },
      { slug: "akcakoca-bey-camii", img: "akc-2", title: "Akçakoca Bey Mosque and Landscape", place: "Kandıra, Kocaeli", year: "2013–2015", type: "Mosque, Landscape, Monument Repair", area: "225 m² · 34,275 m² site", role: "Concept, detailed design, site supervision", award: "Turgut Cansever International Architecture Award, Exhibition and Book Selection (2019) · National Architecture Awards Exhibition (2018) · Arkitera Annual (2016)", photo: "Y. Burak Dolu, Gülnar Ocakdan", summary: "On Babatepe, overlooking the Black Sea, the tomb was freed from roads and traffic. The new mosque reinterprets the early Ottoman type through research into çandı, a nearly forgotten timber construction technique.", gallery: ["akc-2", "akc-1", "akc-3", "akc-4"] },
      { slug: "osman-hamdi-bey-evi", img: "ohb-1", title: "Osman Hamdi Bey House and Outbuilding", place: "Eskihisar, Gebze, Kocaeli", year: "2014–2021", type: "Survey, Restoration, Museum", area: "550 m² · 2,400 m² site", role: "Survey, restitution, restoration, adaptive reuse", summary: "The mansion Osman Hamdi Bey built in 1884 and its outbuilding were documented through survey and restitution. The house keeps its original life as a house museum, while the outbuilding becomes gallery, workshop and museum offices.", gallery: ["ohb-1", "ohb-2", "ohb-3", "ohb-4"] },
      { placeholder: true, slug: "nilufer-carsi-bloklari", img: "p07", title: "Market Blocks", place: "Nilüfer, Bursa", year: "2023", type: "Mixed Use", area: "18,400 m²", role: "Design, BIM", summary: "A row of mid-rise street blocks with shops below and homes above. The blocks leave walking axes open between them; the street begins inside the building, not outside it.", gallery: ["p07", "p09", "p04"] },
      { placeholder: true, slug: "gursu-teras-konutlari", img: "p10", title: "Terrace Housing", place: "Gürsu, Bursa", year: "2025", type: "Housing", area: "9,200 m²", role: "Design, Urban Design", summary: "A stepped housing block set into a slope, every flat with its own garden. The green facade is more than decoration: shade in summer, a windbreak in winter.", gallery: ["p10", "p02", "p13"] },
      { placeholder: true, slug: "yildirim-bahce-blogu", img: "p02", title: "Garden Block", place: "Yıldırım, Bursa", year: "2018", type: "Housing", area: "6,700 m²", role: "Design, Construction", summary: "A five-storey white block where every balcony is a small garden, not a flowerpot. The planted facade softens the building into its neighbourhood.", gallery: ["p02", "p10", "p03"] },
      { placeholder: true, slug: "osmangazi-kultur-atolyesi", img: "p15", title: "Culture Workshop", place: "Osmangazi, Bursa", year: "2026", type: "Cultural Building", area: "4,300 m²", role: "Design, BIM", summary: "A sculptural mass in earth red, holding galleries, workshops and a small hall. A contemporary nod to Bursa's memory of tile and brick.", gallery: ["p15", "p13", "p14"] },
      { placeholder: true, slug: "mudanya-zeytin-evi", img: "p06", title: "Olive House", place: "Mudanya, Bursa", year: "2020", type: "Housing", area: "420 m²", role: "Design, Construction", summary: "A villa among olive trees with a dark cantilevered canopy. The canopy cuts the summer sun and lets the evening light in.", gallery: ["p06", "p12", "p01"] }
    ],
    contact: {
      heading: ["Let's draw", "together."],
      address: ["Cadde224 Sitesi, Fatih Sultan Mehmet Blv. No:41/A", "Workinton · 16140 Nilüfer / Bursa"],
      email: "info@bandemimarlik.com",
      phone: "+90 224 451 33 63",
      note: "Autodesk Authorized Training Center · BIM and Heritage BIM specialists",
      social: [["Instagram", "https://www.instagram.com/bandearchitects/"], ["YouTube", "https://www.youtube.com/@bandearchitects1956"]],
      credit: "© 2026 BANDE Mimarlık Mühendislik Ltd. Şti."
    }
  }
};
