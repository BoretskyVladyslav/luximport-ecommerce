export type HeroSlide = {
  id: string;
  tab: string;
  titleShort: string;
  eyebrow: string;
  title: string;
  description: string;
  buttonText: string;
  href: string;
  highlight: string;
  bg: string;
  bgMobile: string;
  tone: "light" | "dark";
  objectPositionMobile: string;
};

export const heroSlides: HeroSlide[] = [
  {
    id: "premium",
    tab: "Європейський імпорт",
    titleShort: "Преміум",
    eyebrow: "ПРЕМІАЛЬНА СЕЛЕКЦІЯ",
    title: "Елітні продукти з самого серця Європи",
    description:
      "Тільки оригінальна якість та перевірені бренди. Кава, оливкова олія, солодощі та бакалія за прямими цінами імпортера.",
    buttonText: "Перейти до каталогу",
    href: "/catalog",
    highlight: "Оригінал з ЄС • Гуртові ціни від 1 ящика",
    bg: "/images/hero/default/desktop.jpg",
    bgMobile: "/images/hero/default/mobile.webp",
    tone: "dark",
    objectPositionMobile: "center bottom",
  },
  {
    id: "gerard",
    tab: "Dr. Gerard",
    titleShort: "Dr. Gerard",
    eyebrow: "ОРИГІНАЛЬНА ЄВРОПЕЙСЬКА ЯКІСТЬ",
    title: "Легендарне польське печиво Dr. Gerard",
    description:
      "Справжні солодощі для гуртових та роздрібних замовлень. Хіти смаку: Pasja, Mafijne та ChocoBears за прямими цінами імпортера.",
    buttonText: "Переглянути асортимент",
    href: "/catalog?category=dr-gerard",
    highlight: "Опт від 1 ящика • Швидка доставка по всій Україні",
    bg: "/images/hero/dr-gerard/desktop.jpg",
    bgMobile: "/images/hero/dr-gerard/mobile.jpg",
    tone: "light",
    objectPositionMobile: "center 58%",
  },
  {
    id: "juices",
    tab: "Соки Juss",
    titleShort: "Каталог",
    eyebrow: "НАТУРАЛЬНА СВІЖІСТЬ ТА ЕКЗОТИКА",
    title: "Преміальні соки та напої Juss",
    description:
      "Справжні європейські смаки для освіжаючого дня. Гранатовий нектар, екзотична лохина з насінням базиліку та ніжний абрикос за прямими цінами імпортера.",
    buttonText: "Переглянути всі напої",
    href: "/catalog?category=soky-ta-napoi",
    highlight: "Прямий імпорт • Гуртові поставки від 1 ящика",
    bg: "/images/hero/juices/desktop.jpg",
    bgMobile: "/images/hero/juices/mobile.jpg",
    tone: "light",
    objectPositionMobile: "center 60%",
  },
];
