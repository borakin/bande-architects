# BANDE Mimarlık

BANDE Mimarlık için tek sayfalık, tek canvas üzerinde çalışan WebGL tanıtım sitesi. Başlık "Pikselden mekâna" ve piksel fontlu logo ile açılır.

Canlı sürüm: https://borakin.github.io/bande-architects/

## Teknolojiler

- [Vite](https://vite.dev/) (geliştirme sunucusu ve derleme)
- [three.js](https://threejs.org/) (3D sahne)
- [GSAP](https://gsap.com/) (animasyonlar)
- [Lenis](https://lenis.darkroom.engineering/) (yumuşak kaydırma)
- [postprocessing](https://github.com/pmndrs/postprocessing) ve [N8AO](https://github.com/N8python/n8ao) (görsel efektler)
- Yazı tipleri: Inter Tight, Silkscreen (`@fontsource`)

## Kurulum

Node.js 20 veya üstü gerekir.

```bash
npm install
```

## Komutlar

```bash
npm run dev       # Geliştirme sunucusu: http://localhost:5180
npm run build     # Üretim derlemesi, çıktı dist/ klasörüne yazılır
npm run preview   # Derlenmiş sürümü http://localhost:5181 üzerinde açar
```

## Yapı

```
public/        Logo, favicon, OG görseli ve proje görselleri
src/
  main.js      Giriş noktası
  scene/       3D sahne ve kamera
  ui/          Sayfa arayüzü bileşenleri
  data/        İçerik verisi
  styles.css   Genel stiller
index.html     Sayfa iskeleti
```

## Yayınlama

`main` dalına her push'ta `.github/workflows/pages.yml` iş akışı siteyi derler ve GitHub Pages'e yayınlar. Vite'ın `base` ayarı (`/bande-architects/`) proje sayfası adresine göre yapılmıştır. Repo kökü değişirse ya da farklı bir adrese taşınırsa bu ayarı güncelle.
