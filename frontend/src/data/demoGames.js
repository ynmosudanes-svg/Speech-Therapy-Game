export const demoGames = [
  {
    id: 1,
    title: "Listen and Choose",
    titleAr: "اسمع واختار",
    type: "listen_choose",
    level: 1,
    questionText: "Show me the flower",
    questionTextAr: "وريني الوردة",
    questionAudio: "", // No audio file yet
    options: [
      {
        id: 1,
        text: "Flower",
        textAr: "وردة",
        image: "https://images.unsplash.com/photo-1490750967868-88cb4ecb07cb?auto=format&fit=crop&q=80&w=400",
        isCorrect: true
      },
      {
        id: 2,
        text: "Car",
        textAr: "عربية",
        image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=400",
        isCorrect: false
      }
    ],
    successSound: "", 
    failSound: ""
  },
  {
    id: 2,
    title: "Listen and Choose Level 2",
    titleAr: "اسمع واختار - مستوى ٢",
    type: "listen_choose",
    level: 2,
    questionText: "Show me the red apple",
    questionTextAr: "وريني التفاحة الحمرا",
    questionAudio: "",
    options: [
      {
        id: 1,
        text: "Apple",
        textAr: "تفاحة حمرا",
        image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6fac6?auto=format&fit=crop&q=80&w=400",
        isCorrect: true
      },
      {
        id: 2,
        text: "Banana",
        textAr: "موزة",
        image: "https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?auto=format&fit=crop&q=80&w=400",
        isCorrect: false
      },
      {
        id: 3,
        text: "Green Apple",
        textAr: "تفاحة خضرا",
        image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=400",
        isCorrect: false
      }
    ],
    successSound: "", 
    failSound: ""
  }
];
