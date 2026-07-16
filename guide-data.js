window.KOWA_GUIDE = {
  version: 3,
  appName: "Kowakujō – Squad Guide",
  goals: [
    {
      id: "casual",
      icon: "🎮",
      label: "Casual",
      description: "Nur Grundvorbereitung und wichtige Favoriten"
    },
    {
      id: "weapon",
      icon: "⚡",
      label: "Wunderwaffe",
      description: "Kurzroute bis zum Nekomancer"
    },
    {
      id: "easter",
      icon: "🧩",
      label: "Easter Egg",
      description: "Komplette Hauptquest bis zum Finale"
    },
    {
      id: "completion",
      icon: "🏆",
      label: "100 %",
      description: "Alle Schritte und optionale Vorbereitungen"
    }
  ],
  sideQuests: [
    {
      id: "merchant",
      icon: "🛒",
      label: "Merchant",
      note: "Die konkrete Ingame-Variante und benötigten Gegenstände im aktuellen Run prüfen."
    },
    {
      id: "gardener",
      icon: "🌱",
      label: "Gardener",
      note: "Die konkrete Ingame-Reihenfolge und aktiven Hinweise im aktuellen Run prüfen."
    },
    {
      id: "noble",
      icon: "🍶",
      label: "Noble",
      note: "Die konkrete Ingame-Variante und den aktiven Transportweg im aktuellen Run prüfen."
    }
  ],
  bossChecklist: [
    { id: "armor", label: "Rüstung aufgefüllt" },
    { id: "weapons", label: "Waffen verbessert und repariert" },
    { id: "ammo", label: "Munition und Spezialausrüstung voll" },
    { id: "perks", label: "Benötigte Perks aktiv" },
    { id: "revive", label: "Wiederbelebungsoption vorbereitet" },
    { id: "roles", label: "Squad-Rollen abgesprochen" },
    { id: "escape", label: "Arena, Deckung und Fluchtwege geklärt" }
  ],
  zoneMeta: {
    sanctum: {
      label: "Shogun’s Sanctum",
      short: "Sanctum",
      description: "Innerer Questbereich rund um World Seed und zentrale Boss-Trigger."
    },
    tenshu: {
      label: "Tenshu Entrance",
      short: "Tenshu",
      description: "Übergang zwischen dem inneren Festungsbereich und dem oberen Zugang."
    },
    workshop: {
      label: "Workshop",
      short: "Workshop",
      description: "Herstellung, Reparaturen und mehrere Gegenstands-Schritte."
    },
    meditation: {
      label: "Meditation Room",
      short: "Meditation",
      description: "Zentraler Ermittlungsbereich zum Platzieren und Zuordnen von Beweisen."
    },
    staging: {
      label: "Staging Area",
      short: "Staging",
      description: "Übergangs- und Verteidigungsbereich innerhalb der Festung."
    },
    onsen: {
      label: "Onsen Baths",
      short: "Onsen",
      description: "Seitlicher Innenbereich mit möglichen Quest-Interaktionen."
    },
    kitchens: {
      label: "Kitchens",
      short: "Kitchens",
      description: "Bereich für Zutaten, Behälter und mehrere Gift-Schritte."
    },
    storage: {
      label: "Storage Rooms",
      short: "Storage",
      description: "Vorratsräume mit möglichen Gegenständen und Questteilen."
    },
    warroom: {
      label: "War Room",
      short: "War Room",
      description: "Rätsel-, Geist- und Ermittlungsbereich."
    },
    study: {
      label: "Collapse Study",
      short: "Study",
      description: "Innenraum für Hinweise, Schriftrollen und mögliche Beweisgegenstände."
    },
    teagarden: {
      label: "Tea Garden",
      short: "Tea Garden",
      description: "Seitlicher Garten- und Teehausbereich."
    },
    courtyard: {
      label: "Central Courtyard",
      short: "Courtyard",
      description: "Zentraler Knotenpunkt zwischen den wichtigsten Festungsbereichen."
    },
    garden: {
      label: "Flower Garden",
      short: "Flower Garden",
      description: "Gartenbereich für Pflanzen- und Nebenmissions-Schritte."
    },
    stables: {
      label: "Stables",
      short: "Stables",
      description: "Äußerer Seitenbereich mit möglichen Gegenständen und Laufwegen."
    },
    gatehouse: {
      label: "Gatehouse",
      short: "Gatehouse",
      description: "Zugang und Verbindung zwischen Outer Ward und Innenbereich."
    },
    training: {
      label: "Training Area",
      short: "Training",
      description: "Äußerer Kampf- und Verteidigungsbereich."
    },
    outerward: {
      label: "Outer Ward",
      short: "Outer Ward",
      description: "Äußerer Festungsring mit Lava-, Spur- und Kampf-Schritten."
    }
  },
  mapLayout: [
    { id: "sanctum", x: 34, y: 3, w: 32, h: 9, level: "Innerer Kern" },
    { id: "tenshu", x: 29, y: 14, w: 42, h: 8, level: "Oberer Zugang" },

    { id: "workshop", x: 3, y: 27, w: 21, h: 9, level: "Innenbereich" },
    { id: "meditation", x: 27, y: 27, w: 23, h: 9, level: "Innenbereich" },
    { id: "staging", x: 53, y: 27, w: 18, h: 9, level: "Innenbereich" },
    { id: "onsen", x: 74, y: 27, w: 23, h: 9, level: "Innenbereich" },

    { id: "kitchens", x: 3, y: 40, w: 21, h: 9, level: "Mittlere Ebene" },
    { id: "storage", x: 27, y: 40, w: 20, h: 9, level: "Mittlere Ebene" },
    { id: "warroom", x: 50, y: 40, w: 21, h: 9, level: "Mittlere Ebene" },
    { id: "study", x: 74, y: 40, w: 23, h: 9, level: "Mittlere Ebene" },

    { id: "teagarden", x: 3, y: 54, w: 20, h: 10, level: "Hofebene" },
    { id: "courtyard", x: 26, y: 52, w: 48, h: 14, level: "Hofebene" },
    { id: "garden", x: 77, y: 54, w: 20, h: 10, level: "Hofebene" },

    { id: "stables", x: 3, y: 69, w: 24, h: 10, level: "Außenbereich" },
    { id: "gatehouse", x: 30, y: 69, w: 40, h: 10, level: "Außenbereich" },
    { id: "training", x: 73, y: 69, w: 24, h: 10, level: "Außenbereich" },
    { id: "outerward", x: 8, y: 83, w: 84, h: 12, level: "Äußerer Ring" }
  ],
  maps: [
    {
      id: "kowakujo",
      name: "Kowakujō",
      subtitle: "Community-Checkliste und Zonen-Navigator",
      available: true,
      modes: [
        {
          id: "full",
          name: "Komplette Hauptquest",
          description: "Alle Questabschnitte"
        },
        {
          id: "neko",
          name: "Nur Nekomancer",
          description: "Kurzroute bis zur Wunderwaffe"
        }
      ],
      sections: [
        {
          id: "paps",
          title: "1. Pack-a-Punch & World Seed",
          subtitle: "Vorbereitung",
          neko: true,
          goals: ["casual", "weapon", "easter", "completion"],
          steps: [
            {
              id: "wards",
              title: "Zwei Wards aktivieren",
              description: "Beide benötigten Ward-Schritte abschließen.",
              zones: ["outerward", "courtyard"],
              roles: 2
            },
            {
              id: "sanctum",
              title: "Sanctum öffnen",
              description: "Zugang zum Sanctum freischalten.",
              zones: ["sanctum"]
            },
            {
              id: "oni",
              title: "Oni-Miniboss besiegen",
              description: "Den Quest-Miniboss im Sanctum besiegen.",
              zones: ["sanctum"],
              roles: 4
            },
            {
              id: "hanko",
              title: "Shogun’s Hanko aufnehmen",
              description: "Questgegenstand nach dem Kampf aufnehmen.",
              zones: ["sanctum"]
            },
            {
              id: "seed",
              title: "World Seed laden",
              description: "World Seed für die nächsten Questschritte aktivieren.",
              zones: ["sanctum"]
            }
          ]
        },
        {
          id: "maneki",
          title: "2. Maneki-Neko bauen",
          subtitle: "Drei Teile sammeln",
          neko: true,
          goals: ["weapon", "easter", "completion"],
          steps: [
            {
              id: "furin",
              title: "Furin-Glocke finden",
              description: "Community-Fundorte können sich durch Updates ändern.",
              zones: ["teagarden", "courtyard"],
              roles: 1
            },
            {
              id: "karakuri",
              title: "Karakuri-Puppe finden",
              description: "Mögliche Bereiche prüfen.",
              zones: ["workshop", "storage"],
              roles: 1
            },
            {
              id: "statue",
              title: "Maneki-Neko-Statue finden",
              description: "Mögliche Bereiche prüfen.",
              zones: ["meditation", "teagarden"],
              roles: 1
            },
            {
              id: "assemble",
              title: "Im Workshop zusammensetzen",
              description: "Alle Teile am vorgesehenen Baupunkt kombinieren.",
              zones: ["workshop"]
            }
          ]
        },
        {
          id: "nekomancer",
          title: "3. Nekomancer freischalten",
          subtitle: "Kurzquest",
          neko: true,
          goals: ["weapon", "easter", "completion"],
          steps: [
            {
              id: "phd",
              title: "PhD Flopper besorgen",
              description: "Für den folgenden Lava-Schritt vorbereiten.",
              zones: ["courtyard"]
            },
            {
              id: "cage",
              title: "Katzenkäfig finden",
              description: "Käfig im angegebenen Questbereich suchen.",
              zones: ["tenshu"]
            },
            {
              id: "lavacage",
              title: "Käfig in Lava werfen",
              description: "Den Quest-Trigger auslösen.",
              zones: ["outerward"]
            },
            {
              id: "paws",
              title: "Pfotenspuren verfolgen",
              description: "Die aktive Spur bis zum richtigen Bereich verfolgen.",
              zones: ["garden", "outerward"]
            },
            {
              id: "throw",
              title: "Maneki-Neko am aktiven Ziel einsetzen",
              description: "Nur den im aktuellen Run aktiven Questpunkt verwenden.",
              zones: ["outerward"]
            },
            {
              id: "abom",
              title: "Abomination besiegen",
              description: "Questgegner gemeinsam besiegen.",
              zones: ["outerward"],
              roles: 4
            },
            {
              id: "death",
              title: "Death Perception besorgen",
              description: "Für den nächsten Suchschritt vorbereiten.",
              zones: ["courtyard"]
            },
            {
              id: "sneak",
              title: "Katze vorsichtig erreichen",
              description: "Langsam vorgehen und den Quest-Trigger nicht unterbrechen.",
              zones: ["outerward", "courtyard"],
              roles: 2
            },
            {
              id: "carry",
              title: "Katze zum World Seed bringen",
              description: "Questobjekt sicher zum Seed transportieren.",
              zones: ["sanctum"],
              roles: 2
            },
            {
              id: "load",
              title: "Nekomancer aufnehmen",
              description: "Seed-Schritt abschließen und Belohnung aufnehmen.",
              zones: ["sanctum"]
            }
          ]
        },
        {
          id: "lanterns",
          title: "4. Laternen & Geist",
          subtitle: "Ermittlung starten",
          goals: ["easter", "completion"],
          steps: [
            {
              id: "lantern-hit",
              title: "Alle benötigten Laternen aktivieren",
              description: "Die im aktuellen Run geforderte Laternenfolge zügig abschließen.",
              zones: ["courtyard", "teagarden", "outerward", "garden"],
              roles: 2
            },
            {
              id: "war-room",
              title: "Geist im War Room ansprechen",
              description: "Ermittlungsabschnitt starten.",
              zones: ["warroom"]
            }
          ]
        },
        {
          id: "fox",
          title: "5. Fox Mask & Verdächtige",
          subtitle: "Beweise sammeln",
          goals: ["easter", "completion"],
          steps: [
            {
              id: "kite",
              title: "Ninja Kite freischalten",
              description: "Benötigte Flugmechanik aktivieren.",
              zones: ["tenshu"]
            },
            {
              id: "fox-mask",
              title: "Fox Mask aufnehmen",
              description: "Masken-Schritt während der Flugroute abschließen.",
              zones: ["tenshu", "courtyard"]
            },
            {
              id: "simon",
              title: "Maskenwand lösen",
              description: "Aktive Reihenfolge notieren und wiederholen.",
              zones: ["warroom"],
              note: "Maskensequenz"
            },
            {
              id: "takeshi",
              title: "Takeshi’s Pipe finden",
              description: "Community-Angabe im aktuellen Run prüfen.",
              zones: ["stables", "gatehouse"],
              roles: 1
            },
            {
              id: "takeo",
              title: "Takeo’s Case finden",
              description: "Community-Angabe im aktuellen Run prüfen.",
              zones: ["warroom", "study"],
              roles: 1
            },
            {
              id: "comb",
              title: "Mitsuhime’s Comb finden",
              description: "Community-Angabe im aktuellen Run prüfen.",
              zones: ["onsen", "study"],
              roles: 1
            },
            {
              id: "meditation",
              title: "Beweise platzieren",
              description: "Gesammelte Beweise im Ermittlungsraum zuordnen.",
              zones: ["meditation"]
            }
          ]
        },
        {
          id: "accomplice",
          title: "6. Komplize",
          subtitle: "Zufällige Nebenmission",
          goals: ["easter", "completion"],
          steps: [
            {
              id: "coinpurse",
              title: "Coin Purse besorgen",
              description: "Benötigten Questgegenstand erhalten.",
              zones: ["courtyard"]
            },
            {
              id: "sidequest",
              title: "Aktive Nebenmission abschließen",
              description: "Merchant, Gardener oder Noble auswählen und die aktuelle Ingame-Variante befolgen.",
              zones: ["kitchens", "garden", "teagarden"],
              note: "Nebenmissions-Notiz"
            },
            {
              id: "place-accomplice",
              title: "Komplizen-Beweise platzieren",
              description: "Beweise im Ermittlungsraum zuordnen.",
              zones: ["meditation"]
            }
          ]
        },
        {
          id: "poison",
          title: "7. Gift-Beweise",
          subtitle: "Zutaten und Rätsel",
          goals: ["easter", "completion"],
          steps: [
            {
              id: "pouch",
              title: "Empty Pouch finden",
              description: "Questgegenstand sammeln.",
              zones: ["kitchens"]
            },
            {
              id: "ash",
              title: "Volcanic Ash sammeln",
              description: "Aktiven Questpunkt prüfen.",
              zones: ["outerward"]
            },
            {
              id: "monkshood",
              title: "Monkshood sammeln",
              description: "Im aktuellen Run benötigte Variante beachten.",
              zones: ["garden"]
            },
            {
              id: "plum",
              title: "Plum Pit finden",
              description: "Mögliche Bereiche prüfen.",
              zones: ["kitchens", "storage"]
            },
            {
              id: "scroll",
              title: "Scroll-Rätsel lösen",
              description: "Reihenfolge in den Notizen festhalten.",
              zones: ["study", "warroom"],
              note: "Scroll-Reihenfolge"
            },
            {
              id: "pestle",
              title: "Pestle verwenden",
              description: "Zutaten am vorgesehenen Questpunkt verarbeiten.",
              zones: ["kitchens"]
            },
            {
              id: "brainrot",
              title: "Brain Rot-Schritt abschließen",
              description: "Aktive Questinteraktion auslösen.",
              zones: ["kitchens"]
            },
            {
              id: "puffer",
              title: "Pufferfish-Schritt abschließen",
              description: "Aktive Questinteraktion auslösen.",
              zones: ["kitchens"]
            },
            {
              id: "place-poison",
              title: "Gift-Beweise platzieren",
              description: "Beweise im Ermittlungsraum zuordnen.",
              zones: ["meditation"]
            }
          ]
        },
        {
          id: "scene",
          title: "8. Tatort-Beweise",
          subtitle: "Objekte und Verteidigungen",
          goals: ["easter", "completion"],
          steps: [
            {
              id: "shards",
              title: "Zwei Ceramic Shards finden",
              description: "Beide Questteile sammeln.",
              zones: ["storage", "kitchens"]
            },
            {
              id: "sake",
              title: "Sake Cup reparieren",
              description: "Gesammelte Teile am vorgesehenen Punkt kombinieren.",
              zones: ["workshop"]
            },
            {
              id: "defenses",
              title: "Drei Verteidigungen abschließen",
              description: "Alle aktiven Verteidigungspunkte halten.",
              zones: ["training", "staging", "courtyard"],
              roles: 4
            },
            {
              id: "horse",
              title: "Horse Statuette finden",
              description: "Möglichen Questbereich prüfen.",
              zones: ["stables"]
            },
            {
              id: "brush",
              title: "Calligraphy Brush finden",
              description: "Möglichen Questbereich prüfen.",
              zones: ["study"]
            },
            {
              id: "whisk",
              title: "Tea Whisk finden",
              description: "Möglichen Questbereich prüfen.",
              zones: ["teagarden"]
            },
            {
              id: "place-scene",
              title: "Tatort-Beweise platzieren",
              description: "Beweise im Ermittlungsraum zuordnen.",
              zones: ["meditation"]
            }
          ]
        },
        {
          id: "motive",
          title: "9. Motiv-Beweise",
          subtitle: "Codes und Zuordnung",
          goals: ["easter", "completion"],
          steps: [
            {
              id: "hanko-motive",
              title: "Shogun’s Hanko einsetzen",
              description: "Gesammelten Questgegenstand zuordnen.",
              zones: ["meditation"]
            },
            {
              id: "netsuke",
              title: "Netsuke of Brothers finden",
              description: "Möglichen Questbereich prüfen.",
              zones: ["study"]
            },
            {
              id: "clock",
              title: "Uhrcode lösen",
              description: "Aktive Lösung notieren.",
              zones: ["warroom"],
              note: "Uhrcode"
            },
            {
              id: "banners",
              title: "Banner zuordnen",
              description: "Aktive Reihenfolge notieren.",
              zones: ["warroom", "gatehouse"],
              note: "Banner-Reihenfolge"
            },
            {
              id: "crest",
              title: "Crest Medallion erhalten",
              description: "Vorherige Rätsel vollständig abschließen.",
              zones: ["warroom"]
            },
            {
              id: "place-motive",
              title: "Motiv-Beweise platzieren",
              description: "Beweise im Ermittlungsraum zuordnen.",
              zones: ["meditation"]
            }
          ]
        },
        {
          id: "solve",
          title: "10. Mordfall lösen",
          subtitle: "Finale Ermittlung",
          goals: ["easter", "completion"],
          steps: [
            {
              id: "witness",
              title: "Ghostly Rifleman befragen",
              description: "Aussage notieren.",
              zones: ["staging"],
              note: "Zeugenaussage"
            },
            {
              id: "paintings",
              title: "Gemälde korrekt belegen",
              description: "Beweise den richtigen Bildern zuordnen.",
              zones: ["meditation"]
            },
            {
              id: "poison-pick",
              title: "Gift bestimmen",
              description: "Aktive Lösung notieren.",
              zones: ["meditation"],
              note: "Gift-Lösung"
            },
            {
              id: "zodiac",
              title: "Zodiac Dial einstellen",
              description: "Aktive Lösung notieren.",
              zones: ["meditation"],
              note: "Zodiac-Lösung"
            },
            {
              id: "incense",
              title: "Räucherschalen aktivieren",
              description: "Finalen Quest-Trigger auslösen.",
              zones: ["meditation", "sanctum"]
            }
          ]
        },
        {
          id: "finale",
          title: "11. Finale",
          subtitle: "Bossabschnitt",
          goals: ["easter", "completion"],
          steps: [
            {
              id: "shield",
              title: "Optionales Upgrade vorbereiten",
              description: "Vor dem Finale Ausrüstung und Ressourcen prüfen.",
              zones: ["workshop"],
              goals: ["completion"]
            },
            {
              id: "bullet",
              title: "Finalen Seed-Schritt starten",
              description: "Questgegenstand am World Seed einsetzen.",
              zones: ["sanctum"]
            },
            {
              id: "onryo",
              title: "Onryo besiegen",
              description: "Ersten Bossabschnitt abschließen.",
              zones: ["sanctum"],
              roles: 4
            },
            {
              id: "nyxara",
              title: "Nyxara besiegen",
              description: "Alle Phasen des finalen Bosskampfs abschließen.",
              zones: ["sanctum", "courtyard"],
              roles: 4
            }
          ]
        }
      ]
    },
    {
      id: "totenreich",
      name: "Totenreich",
      subtitle: "Bald verfügbar",
      available: false
    },
    {
      id: "future",
      name: "Weitere Maps",
      subtitle: "Bald verfügbar",
      available: false
    }
  ]
};
