import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
  SafeAreaView,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
  Vibration,
  Switch,
  Keyboard,
  PanResponder,
  useWindowDimensions,
} from "react-native";
import { advancePosition, displayTeamName, getCategoryByPos, pickUnusedWord } from "./game-logic";

/* =========================================================
   COLORS + CONSTANTS
========================================================= */
const COLORS = {
  bg: "#FDF0D5",
  white: "#FFFFFF",

  // Base palette
  c1: "#780000",
  c2: "#C1121F",
  c3: "#003049",
  c4: "#669BBC",

  // Menu sections
  difficultyBg: "#F4D58D",
  durationBg: "#A7C957",

  // Category palette
  catYellow: "#F4D58D",
  catBlue: "#669BBC",
  catOrange: "#FFAA00",
  catGreen: "#A7C957",
  catRed: "#C1121F",

  // Pawn palette (team picker)
  pawnYellow: "#FFD60A",
  pawnRed: "#710000",
  pawnIndigo: "#A2D6F9",
  pawnBlack: "#202020",
};

const DIFFICULTIES = [
  { key: "bassa", label: "Bassa", recommended: 90 },
  { key: "media", label: "Media", recommended: 90 }, // user wants 1 min 30s at "media"
  { key: "alta", label: "Alta", recommended: 60 },
];

const CATEGORY_META = {
  yellow: { label: "Persone, luoghi e animali", short: "Persone/Luoghi/Animali", color: COLORS.catYellow },
  blue: { label: "Oggetti", short: "Oggetti", color: COLORS.catBlue },
  orange: { label: "Azioni", short: "Azioni", color: COLORS.catOrange },
  green: { label: "Difficili", short: "Difficili", color: COLORS.catGreen },
  red: { label: "Sfida", short: "Sfida", color: COLORS.catRed },
};

const PAWN_CHOICES = [
  { key: "pawnYellow", label: "Giallo", color: COLORS.pawnYellow },
  { key: "pawnRed", label: "Rosso", color: COLORS.pawnRed },
  { key: "pawnIndigo", label: "Indaco", color: COLORS.pawnIndigo },
  { key: "pawnBlack", label: "Nero", color: COLORS.pawnBlack },
];

function rangeDurations() {
  const out = [];
  for (let s = 30; s <= 150; s += 5) out.push(s);
  return out;
}

function formatSecondsLong(s) {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (r === 0) return `${m} min`;
  return `${m} min ${r}s`;
}

function formatMMSS(totalSeconds) {
  const s = Math.max(0, totalSeconds | 0);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

/* =========================================================
   WORDS (as provided)
========================================================= */
const WORDS = {
  yellow: {
    bassa: [
      "mamma","papà","bambino","nonna","nonno","amico","maestra","dottore","poliziotto","pompiere",
      "re","regina","pirata","clown","cuoco","calciatore","ballerina","principessa",
      "cane","gatto","cavallo","leone","tigre","elefante","scimmia","giraffa","mucca","pecora","maiale","gallina",
      "pesce","squalo","delfino","ape","farfalla",
      "casa","scuola","parco","castello","spiaggia","montagna","bosco","zoo","fattoria","ospedale","supermercato","aeroporto",
      "isola","deserto","foresta",
    ],
    media: [
      "astronauta","scienziato","fotografo","giudice","sindaco","postino","meccanico","veterinario","attore","cantante",
      "esploratore","detective","ninja","cavaliere","fantasma","drago","sirena",
      "coccodrillo","pinguino","panda","canguro","cammello","aquila","gufo","serpente","lupo","orso polare",
      "jungla","vulcano","cascata","faro","stadio","museo","teatro","luna park","metropolitana","villaggio","capitale",
      "prigione","tribunale","safari","ghiacciaio","savana","barriera corallina","tempio","piramide","grattacielo",
      "porto","lago","fiume",
    ],
    alta: [
      "archeologo","illusionista","coreografo","ambasciatore","funambolo","domatore","alchimista","gladiatore","samurai",
      "centauro","minotauro","fenice","basilisco","ornitorinco","bradipo","calamaro gigante","iguana","pantera nera",
      "tundra","altopiano","fiordo","canyon","laguna","monastero","osservatorio","rovine","santuario","metropoli",
      "arcipelago","periferia","avamposto","sala operatoria","laboratorio segreto","ambasciata","quartiere finanziario",
      "isola vulcanica","villaggio abbandonato","antartide","equatore","muraglia","città sotterranea","stazione spaziale",
      "centrale nucleare","tempio maya","città fantasma","foresta pluviale","deserto glaciale","porto commerciale",
      "riserva naturale","cittadella medievale",
    ],
  },

  blue: {
    bassa: [
      "palla","sedia","tavolo","letto","libro","matita","penna","zaino","scarpa","cappello","occhiali","telefono","televisione",
      "bicchiere","piatto","forchetta","cucchiaio","coltello","spazzolino","sapone","asciugamano","orologio","chiave",
      "porta","finestra","macchina","bicicletta","ombrello","palloncino","candela","torta","regalo",
      "chitarra","tamburo","microfono","valigia","frigorifero","forno","computer","mouse","tastiera","telecomando",
      "specchio","lampada","tappeto","cuscino","aquilone","skateboard","casco","zattera",
    ],
    media: [
      "monopattino","trapano","martello pneumatico","bussola","mappamondo","binocolo","macchina fotografica","videocamera",
      "joystick","volante","timone","ancora","telescopio","microscopio","lanterna","torcia","clessidra","bilancia",
      "estintore","armatura","scudo","arco","freccia","paracadute","scafandro","salvagente",
      "pianoforte","violino","tromba","megafono","microonde","stampante","caricabatterie","cuffie","drone",
      "tavola da surf","pattini","snowboard","seggiovia","gru","ruspa","carrello della spesa","cassaforte","ventilatore",
      "altoparlante","mixer","trapano elettrico","fionda","frullatore","giradischi",
    ],
    alta: [
      "metronomo","grammofono","telegrafo","macchina da scrivere","caleidoscopio","astrolabio","sestante","catapulta",
      "ariete","sarcofago","obelisco","totem","scettro","diadema","bacchetta magica","calderone","pergamena",
      "mappa del tesoro","cronometro","acceleratore di particelle","reattore nucleare","pannello solare","turbina eolica",
      "sommergibile","dirigibile","boomerang","marionetta","carillon","xilofono","oblò","levigatrice","stampo industriale",
      "smartwatch","macchina del tempo","radar","sottomarino nucleare","tastiera meccanica","spada laser","ologramma",
      "scanner 3D","defibrillatore","proiettore olografico","elica","batiscafo","telescopio spaziale","stampante 3D",
      "esoscheletro","detonatore","valvola idraulica","giroscopio",
    ],
  },

  orange: {
    bassa: [
      "correre","saltare","camminare","dormire","mangiare","bere","ridere","piangere","leggere","scrivere","cantare","ballare",
      "nuotare","guidare","volare","parlare","ascoltare","cucinare","lavare","spazzare","disegnare","colorare","aprire",
      "chiudere","lanciare","prendere","spingere","tirare","cadere","sedersi","alzarsi","abbracciare","baciare","telefonare",
      "studiare","insegnare","giocare","fotografare","pescare","scavare","costruire","rompere","riparare","spegnere",
      "accendere","gridare","sussurrare","applaudire","salutare","arrampicarsi",
    ],
    media: [
      "atterrare","decollare","meditare","investigare","negoziare","tradurre","imitare","esplorare","inseguire","fuggire",
      "inciampare","tuffarsi","galleggiare","planare","congelare","sciogliere","dipingere","scolpire","modellare",
      "programmare","hackerare","inventare","sabotare","recitare","dirigere","improvvisare","ipnotizzare","teletrasportarsi",
      "sfidare","spiare","origliare","spaventare","rassicurare","confortare","vendicarsi","confessare","pregare","arrendersi",
      "conquistare","dominare","comandare","obbedire","esitare","collaborare","competere","discutere","persuadere",
      "organizzare","coordinare","manipolare",
    ],
    alta: [
      "procrastinare","materializzarsi","ribellarsi","cospirare","disintegrare","sincronizzarsi","metamorfosarsi",
      "ipotizzare","dedurre","generalizzare","sintetizzare","distorcere","amplificare","ironizzare","destabilizzare",
      "equilibrare","oscillare","collassare","germogliare","decifrare","codificare","decriptare","immortalare","contemplare",
      "trasfigurare","galvanizzare","scoraggiare","illudere","rievocare","simulare","orchestrare","trionfare","soccombere",
      "filosofeggiare","riflettere","autocelebrarsi","redimersi","sovrastimare","sottovalutare","argomentare",
      "contraddire","mediare","radicalizzarsi","evolversi","dissolversi","frammentare","convergere","divergere",
      "neutralizzare","sublimare",
    ],
  },

  green: {
    bassa: [
      "amore","paura","felicità","rabbia","tristezza","amicizia","libertà","fortuna","sogno","incubo","mistero","segreto",
      "sorpresa","viaggio","avventura","tempo","energia","rumore","silenzio","luce","ombra","caldo","freddo","fame","sete",
      "sonno","velocità","forza","equilibrio","caos","ordine","errore","successo","fallimento","inizio","fine","centro",
      "confine","scelta","dubbio","memoria","futuro","passato","presente","pensiero","idea","problema","soluzione","pace","guerra",
    ],
    media: [
      "paradosso","destino","coincidenza","illusione","apparenza","verità","inganno","speranza","nostalgia","rimorso","orgoglio",
      "gelosia","intuizione","ispirazione","ambizione","sacrificio","compromesso","tensione","armonia","crisi","rinascita",
      "rivoluzione","tradizione","progresso","ossessione","dipendenza","resilienza","responsabilità","giustizia","coraggio",
      "vigliaccheria","empatia","solitudine","identità","reputazione","leadership","potere","influenza","censura","propaganda",
      "democrazia","anarchia","globalizzazione","innovazione","algoritmo","sostenibilità","manipolazione","etica","morale","fiducia",
    ],
    alta: [
      "entropia","relatività","infinito","eternità","trascendenza","dualismo","nichilismo","determinismo","libero arbitrio",
      "inconscio collettivo","singolarità","utopia","distopia","simulazione","caos deterministico","teoria del tutto",
      "effetto farfalla","buco nero","quarta dimensione","coscienza artificiale","bias cognitivo","alienazione","sinestesia",
      "iperrealtà","sublimazione","paradigma","decentralizzazione","sovranità digitale","collasso sistemico","post-verità",
      "quantistica","sovrappopolazione","collasso climatico","immortalità digitale","realtà aumentata","metaverso","catarsi",
      "oblio","trascendenza tecnologica","determinismo genetico","pluralismo","egemonia","antropocene","speculazione",
      "relativismo morale","identità liquida","complessità emergente","asimmetria informativa","entità astratta","simulacro",
    ],
  },

  red: {
    bassa: [
      "perdere l’autobus","vincere una gara","rompere un piatto","trovare un tesoro","cercare le chiavi","scoppiare a ridere",
      "dormire in piedi","mangiare troppo","fare le valigie","salire su una montagna","costruire un castello di sabbia",
      "giocare a nascondino","spaventarsi al buio","scivolare sul ghiaccio","pescare uno squalo","cadere in acqua",
      "cucinare spaghetti","parlare con un fantasma","abbracciare un cactus","ballare sotto la neve","fare yoga",
      "dipingere un quadro","spegnere un incendio","vincere alla lotteria","scalare un muro","fare un picnic","fare una sorpresa",
      "guidare al contrario","costruire una capanna","scappare da un mostro","fare un puzzle gigante","nuotare con i delfini",
      "perdere una scarpa","salvare un gattino","aprire un ombrello al vento","correre sotto la pioggia","cadere dalla sedia",
      "imitare una scimmia","leggere al contrario","costruire una torre altissima","saltare in una pozzanghera",
      "soffiare su una candela gigante","lanciare una torta","nascondersi dietro una tenda","rompere un palloncino",
      "aprire un regalo enorme","cadere dal letto","farsi un selfie buffo","scappare da un’ape","arrampicarsi su un albero",
    ],
    media: [
      "fare una proposta di matrimonio","perdere la memoria","viaggiare nel tempo","cambiare identità","salvare il pianeta",
      "hackerare un computer","fuggire da una prigione","scoprire un pianeta","fondare una città","diventare invisibile",
      "parlare con alieni","sopravvivere su un’isola deserta","trovare una cura","addestrare un drago","affrontare un esame impossibile",
      "correre una maratona","costruire un razzo","risolvere un mistero","sfuggire a un inseguimento","comandare un esercito",
      "ricostruire da zero","scalare l’Everest","attraversare l’Antartide","spegnere un vulcano","catturare un ladro",
      "diventare re","lanciare una startup","fare un discorso storico","vincere una battaglia","fare pace dopo una guerra",
      "decifrare un codice segreto","trovare Atlantide","fermare il tempo","combattere un mostro marino","dominare il mondo",
      "sopravvivere a un’apocalisse","ribaltare una situazione","organizzare una fuga","costruire una città galleggiante",
      "negoziare la pace","inventare qualcosa di rivoluzionario","salvare un amico","affrontare un tribunale",
      "guidare una nave nella tempesta","attraversare un deserto","dirigere un’orchestra","sabotare un piano","scoprire un complotto",
      "vincere un torneo mondiale","sopravvivere nella giungla",
    ],
    alta: [
      "convincere il mondo intero","cambiare il passato senza alterare il futuro","negoziare la pace mondiale","manipolare l’opinione pubblica",
      "affrontare il proprio doppio","entrare in un sogno","uscire da un labirinto infinito","riscrivere la storia","sfuggire alla gravità",
      "creare un universo parallelo","fermare un buco nero","spezzare una maledizione antica","dominare la mente altrui",
      "combattere contro se stessi","sfidare la morte","vendere l’anima","barare col destino","attraversare uno specchio magico",
      "orchestrare un colpo perfetto","ribaltare un governo","costruire una società perfetta","distruggere un sistema corrotto",
      "decifrare un linguaggio alieno","manipolare il tempo","sfuggire a una simulazione","spezzare un paradosso temporale",
      "raggiungere l’immortalità","guidare una ribellione globale","sopravvivere alla fine del mondo","scoprire il senso della vita",
      "affrontare l’infinito","colonizzare Marte","unire due mondi opposti","salvare una specie estinta","invertire il cambiamento climatico",
      "entrare nella mente di qualcuno","fermare un’intelligenza artificiale ribelle","attraversare un wormhole","guidare una rivoluzione digitale",
      "spezzare una dittatura","fondare una nuova civiltà","vincere contro il caos","creare la pace eterna","annullare la gravità",
      "cambiare il destino dell’umanità","fermare il tempo per sempre","riscrivere le leggi della fisica","affrontare un dio",
      "spezzare la realtà","superare l’infinito",
    ],
  },
};

/* =========================================================
   UI COMPONENTS
========================================================= */
function SoftButton({
  children,
  onPress,
  style,
  disabled = false,
  haptic = false,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.985,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.93,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const pressOut = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        stiffness: 320,
        damping: 22,
        mass: 0.7,
        useNativeDriver: true,
      }),
      Animated.spring(lift, {
        toValue: 0,
        stiffness: 320,
        damping: 22,
        mass: 0.7,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (disabled) return;
    if (haptic) Vibration.vibrate(8);
    onPress?.();
  };

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={handlePress} disabled={disabled}>
      <Animated.View
        style={[
          styles.btnBase,
          disabled && { opacity: 0.55 },
          style,
          {
            transform: [
              { scale },
              {
                translateY: lift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -1.5],
                }),
              },
            ],
            opacity,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

function ScreenTransition({ children, style }) {
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    a.setValue(0);
    Animated.timing(a, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [a]);

  const opacity = a;
  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  return (
    <Animated.View style={[{ flex: 1, opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

function Dropdown({ valueLabel, options, selectedValue, onPick, darkText = false }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.dropdownRow}>
        <View style={styles.dropdownRight}>
          <Text style={[styles.dropdownValue, darkText && { color: COLORS.c3 }]}>{valueLabel}</Text>
          <Text style={[styles.chev, darkText && { color: "rgba(0,48,73,0.75)" }]}>▾</Text>
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {options.map((opt) => {
                const val = opt.value ?? opt.key ?? opt;
                const isSelected = selectedValue === val;
                return (
                  <Pressable
                    key={opt.key ?? String(opt.value ?? opt)}
                    onPress={() => {
                      setOpen(false);
                      onPick(opt);
                    }}
                    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {opt.label ?? String(opt)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <SoftButton onPress={() => setOpen(false)} style={{ marginTop: 12, backgroundColor: COLORS.c4 }}>
              <Text style={styles.btnText}>Chiudi</Text>
            </SoftButton>
          </View>
        </View>
      </Modal>
    </>
  );
}

function LoadingScreen({ phrase }) {
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    a.setValue(0);
    Animated.timing(a, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [a]);

  const opacity = a;
  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });

  return (
    <View style={styles.loadingWrap}>
      <Animated.View style={[styles.loadingCard, { opacity, transform: [{ translateY }] }]}>
        <View style={styles.loadingIcon} />
        <Text style={styles.loadingTitle}>Caricamento…</Text>
        <Text style={styles.loadingPhrase}>{phrase}</Text>
      </Animated.View>
    </View>
  );
}

function Pawn({ color, size = 16 }) {
  const cap = Math.max(10, size);
  const baseW = cap * 1.05;

  return (
    <View style={{ width: baseW, height: cap * 1.45, alignItems: "center", justifyContent: "flex-start" }}>
      <View
        style={{
          width: cap,
          height: cap,
          borderRadius: cap / 2,
          backgroundColor: color,
          shadowColor: "#000",
          shadowOpacity: 0.22,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        }}
      />
      <View
        style={{
          width: cap * 0.9,
          height: cap * 0.7,
          marginTop: -cap * 0.15,
          borderRadius: cap * 0.45,
          backgroundColor: color,
          opacity: 0.98,
          shadowColor: "#000",
          shadowOpacity: 0.16,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: cap * 0.18,
          left: cap * 0.18,
          width: cap * 0.32,
          height: cap * 0.22,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.35)",
        }}
      />
    </View>
  );
}

function ExitModal({
  visible,
  onClose,
  onExitToMenu,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.exitCard, { backgroundColor: COLORS.c3 }]}>
          <Text style={styles.exitTitle}>Vuoi abbandonare la partita?</Text>

          <View style={styles.exitButtonsRow}>
            <SoftButton
              onPress={onExitToMenu}
              style={[styles.exitBtn, { backgroundColor: COLORS.c2 }]}
              haptic
            >
              <Text style={styles.exitBtnText}>Sì</Text>
            </SoftButton>

            <SoftButton
              onPress={onClose}
              style={[styles.exitBtn, { backgroundColor: COLORS.durationBg }]}
              haptic
            >
              <Text style={[styles.exitBtnText, { color: COLORS.c3 }]}>No</Text>
            </SoftButton>
          </View>

        </View>
      </View>
    </Modal>
  );
}

function PhysicalDiceModal({ visible, onClose, onSelect }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.physicalDiceCard}>
          <Text style={styles.physicalDiceTitle}>Che numero è uscito?</Text>
          <Text style={styles.physicalDiceCopy}>Tira il tuo dado e registra qui il risultato.</Text>
          <View style={styles.physicalDiceGrid}>
            {[1, 2, 3, 4, 5, 6].map((value) => (
              <Pressable key={value} onPress={() => onSelect(value)} style={({ pressed }) => [styles.physicalDiceChoice, pressed && { opacity: 0.78 }]}>
                <Text style={styles.physicalDiceChoiceText}>{value}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={onClose} style={styles.physicalDiceCancel}>
            <Text style={styles.physicalDiceCancelText}>Annulla</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function InfoModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.infoCard, { backgroundColor: COLORS.bg }]}>
          <Pressable onPress={onClose} style={styles.infoClose}>
            <Text style={styles.infoCloseText}>×</Text>
          </Pressable>

          <Text style={styles.infoTitle}>Come si gioca</Text>

          <View style={styles.rulesSummary}>
            <Text style={styles.rulesSummaryText}>1. Tira il dado nell’app oppure usa un dado fisico: la casella di arrivo decide la categoria.</Text>
            <Text style={styles.rulesSummaryText}>2. Mostra la parola solo a chi disegna e avvia il timer.</Text>
            <Text style={styles.rulesSummaryText}>3. Se la squadra indovina, avanza e gioca ancora. Altrimenti passa il turno.</Text>
            <Text style={styles.rulesSummaryText}>4. Vince la prima squadra che raggiunge la casella 60.</Text>
          </View>

          <Text style={styles.infoSectionTitle}>Categorie</Text>

          <View style={{ marginTop: 12, gap: 10 }}>
            {[
              { c: COLORS.catYellow, t: "Persone, luoghi e animali" },
              { c: COLORS.catBlue, t: "Oggetti" },
              { c: COLORS.catOrange, t: "Azioni" },
              { c: COLORS.catGreen, t: "Difficili" },
              { c: COLORS.catRed, t: "Sfida" },
            ].map((x) => (
              <View key={x.t} style={styles.infoRow}>
                <View style={[styles.infoSquare, { backgroundColor: x.c }]} />
                <Text style={styles.infoText}>{x.t}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* =========================================================
   APP
========================================================= */
export default function App() {
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const compactWidth = viewportWidth < 360;
  const compactHeight = viewportHeight < 700;

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // Screens:
  // pre-game: welcome | menu | teams | settings
  // in-game: board | dice | category | timer | timeout | win
  const [screen, setScreen] = useState("welcome");
  const [loading, setLoading] = useState(false);

  // default difficulty = media
  const [difficulty, setDifficulty] = useState("media");
  const recommendedSeconds = useMemo(() => {
    return DIFFICULTIES.find((d) => d.key === difficulty)?.recommended ?? 90;
  }, [difficulty]);

  const durations = useMemo(() => rangeDurations(), []);
  const [turnSeconds, setTurnSeconds] = useState(90);

  // Teams
  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState(["Squadra 1", "Squadra 2"]);
  const inputRefs = useRef([]);

  const [teamPawnColors, setTeamPawnColors] = useState([
    COLORS.pawnYellow,
    COLORS.pawnRed,
    COLORS.pawnIndigo,
    COLORS.pawnBlack,
  ]);

  const [pawnWarnOpen, setPawnWarnOpen] = useState(false);
  const [physicalDiceOpen, setPhysicalDiceOpen] = useState(false);

  // The only device preference currently implemented by the game.
  const [vibrationOn, setVibrationOn] = useState(true);

  // Loading phrases
  const loadingPhrases = useMemo(
    () => [
      "Prepara fogli e pennarelli.",
      "Niente lettere, niente numeri: solo disegni.",
      "La squadra avversaria può leggere la parola.",
      "Quando siete pronti, il timer parte.",
      "Indovinato? Il turno continua.",
    ],
    []
  );
  const [loadingPhrase, setLoadingPhrase] = useState(loadingPhrases[0]);

  // Keep turnSeconds aligned to recommended when difficulty changes
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTurnSeconds(recommendedSeconds);
  }, [recommendedSeconds]);

  // Keep teams array lengths aligned (max 4)
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTeamNames((prev) => {
      const next = [...prev];
      while (next.length < teamCount) next.push(`Squadra ${next.length + 1}`);
      while (next.length > teamCount) next.pop();
      return next;
    });
    setTeamPawnColors((prev) => {
      const next = [...prev];
      while (next.length < teamCount) next.push(PAWN_CHOICES[next.length % 4].color);
      while (next.length > teamCount) next.pop();
      // enforce uniqueness (best effort)
      const used = new Set();
      for (let i = 0; i < next.length; i++) {
        if (used.has(next[i])) {
          const free = PAWN_CHOICES.map((p) => p.color).find((c) => !used.has(c));
          next[i] = free || next[i];
        }
        used.add(next[i]);
      }
      return next;
    });
  }, [teamCount]);

  function setRandomLoadingPhrase() {
    setLoadingPhrase(loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)]);
  }

  function go(nextScreen) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setScreen(nextScreen);
  }

  async function goWithLoading(nextScreen) {
    setRandomLoadingPhrase();
    setLoading(true);
    await sleep(900);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setScreen(nextScreen);
    setLoading(false);
  }

  /* -------------------------
     IN-GAME STATE
  -------------------------- */
  const [exitOpen, setExitOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const [activeTeam, setActiveTeam] = useState(0); // index
  const [positions, setPositions] = useState([1, 1, 1, 1]); // 1..60
  const [lastRoll, setLastRoll] = useState(null);

  const [pendingMoveFrom, setPendingMoveFrom] = useState(1);
  const [pendingCategory, setPendingCategory] = useState("yellow");
  const [pendingWord, setPendingWord] = useState("");
  const [wordShown, setWordShown] = useState(false);
  const usedWordsRef = useRef(new Set());

  // Timer state
  const [timerLeft, setTimerLeft] = useState(turnSeconds);
  const timerIntervalRef = useRef(null);

  // Dice animation state
  const diceSpin = useRef(new Animated.Value(0)).current;
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceResult, setDiceResult] = useState(null);
  const diceStopTimeoutRef = useRef(null);

  // Grid sizing (board fill)
  const [gridH, setGridH] = useState(0);
  const cellH = gridH ? gridH / 10 : 34;

  // Gestures for TEAMS: swipe right to menu, swipe down to dismiss keyboard
  const teamsPan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => {
          const ax = Math.abs(g.dx);
          const ay = Math.abs(g.dy);
          return ax > 14 || ay > 14;
        },
        onPanResponderRelease: (_, g) => {
          if (g.dx > 80 && Math.abs(g.dy) < 50 && g.vx > 0.25) {
            Keyboard.dismiss();
            go("menu");
            return;
          }
          if (g.dy > 80 && Math.abs(g.dx) < 50 && g.vy > 0.15) {
            Keyboard.dismiss();
          }
        },
      }),
    []
  );

  function resetGame() {
    // reset in-game
    setExitOpen(false);
    setInfoOpen(false);
    setPhysicalDiceOpen(false);
    setActiveTeam(0);
    setPositions([1, 1, 1, 1]);
    setLastRoll(null);
    setPendingMoveFrom(1);
    setPendingCategory("yellow");
    setPendingWord("");
    setWordShown(false);
    usedWordsRef.current.clear();
    setTimerLeft(turnSeconds);
    setDiceRolling(false);
    setDiceResult(null);
    diceSpin.stopAnimation();
    diceSpin.setValue(0);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    if (diceStopTimeoutRef.current) clearTimeout(diceStopTimeoutRef.current);
    diceStopTimeoutRef.current = null;
  }

  function exitToMenu() {
    resetGame();
    go("menu");
  }

  function openExit() {
    setExitOpen(true);
  }

  // Start game: go to board after loading from menu
  function startGame() {
    resetGame();
    goWithLoading("board");
  }

  /* -------------------------
     BOARD -> DICE -> CATEGORY
  -------------------------- */
  function onPressRollFromBoard() {
    // go to dice screen
    setDiceResult(null);
    setDiceRolling(false);
    go("dice");
  }

  function prepareChallengeFromRoll(result, delay = 0) {
    setLastRoll(result);

    const fromPos = positions[activeTeam] || 1;
    const targetPos = advancePosition(fromPos, result);
    const cat = getCategoryByPos(targetPos);
    const word = pickUnusedWord(WORDS, cat, difficulty, usedWordsRef.current);

    setPendingMoveFrom(fromPos);
    setPendingCategory(cat);
    setPendingWord(word);
    setWordShown(false);

    if (delay > 0) {
      diceStopTimeoutRef.current = setTimeout(() => go("category"), delay);
    } else {
      go("category");
    }
  }

  function usePhysicalDice(result) {
    setPhysicalDiceOpen(false);
    prepareChallengeFromRoll(result);
  }

  function beginDiceSpinLoop() {
    diceSpin.setValue(0);
    Animated.loop(
      Animated.timing(diceSpin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }

  useEffect(() => {
    // start/stop dice loop when entering/leaving dice screen
    if (screen === "dice") {
      beginDiceSpinLoop();
    } else {
      diceSpin.stopAnimation();
      diceSpin.setValue(0);
      setDiceRolling(false);
      setDiceResult(null);
      if (diceStopTimeoutRef.current) clearTimeout(diceStopTimeoutRef.current);
      diceStopTimeoutRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  async function rollDice() {
    if (diceRolling) return;
    setDiceRolling(true);

    // uniform 1..6
    const result = 1 + Math.floor(Math.random() * 6);
    // slow down over 3 seconds (fake deceleration by running one long easing)
    diceSpin.stopAnimation();
    diceSpin.setValue(0);

    Animated.timing(diceSpin, {
      toValue: 1,
      duration: 3000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // reveal after 3s
    diceStopTimeoutRef.current = setTimeout(() => {
      setDiceResult(result);
      setDiceRolling(false);

      prepareChallengeFromRoll(result, 700);
    }, 3000);
  }

  /* -------------------------
     CATEGORY -> TIMER -> RESULT
  -------------------------- */
  function goToTimer() {
    // init timer
    setTimerLeft(turnSeconds);
    go("timer");
  }

  function stopTimer() {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
  }

  function startTimerTicking() {
    stopTimer();
    timerIntervalRef.current = setInterval(() => {
      setTimerLeft((t) => Math.max(0, t - 1));
    }, 1000);
  }

  // pulse animation for timer
  const pulse = useRef(new Animated.Value(0)).current;
  function startPulse(intensity) {
    pulse.stopAnimation();
    pulse.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: Math.max(220, 520 - intensity), easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: Math.max(220, 520 - intensity), easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }
  function stopPulse() {
    pulse.stopAnimation();
    pulse.setValue(0);
  }

  useEffect(() => {
    if (screen === "timer") {
      startTimerTicking();
      // start pulsing only under 30s; but we can run it and adjust intensity dynamically below
    } else {
      stopTimer();
      stopPulse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // last-5-second feedback (using vibration to avoid external audio libs)
  useEffect(() => {
    if (screen !== "timer") return;

    if (timerLeft === 0) {
      stopTimer();
      stopPulse();
      go("timeout");
      return;
    }

    // pulse behaviour
    if (timerLeft <= 30) {
      // intensity grows as seconds decrease
      const intensity = (30 - timerLeft) * 8; // 0..240
      startPulse(intensity);
    } else {
      stopPulse();
    }

    if (timerLeft <= 5 && timerLeft > 0) {
      if (vibrationOn) Vibration.vibrate(35);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerLeft, screen, vibrationOn]);

  function resolveTurn(indovinata) {
    stopTimer();
    stopPulse();

    const roll = lastRoll || 0;
    const fromPos = pendingMoveFrom || (positions[activeTeam] || 1);
    const targetPos = advancePosition(fromPos, roll);

    if (indovinata) {
      setPositions((prev) => {
        const next = [...prev];
        next[activeTeam] = targetPos;
        return next;
      });

      // win check
      if (targetPos >= 60) {
        go("win");
        return;
      }

      // same team continues
      go("board");
      return;
    }

    // not guessed: stay, next team
    setActiveTeam((t) => (t + 1) % teamCount);
    go("board");
  }

  /* =========================================================
     RENDER: LOADING
  ========================================================= */
  if (loading) return <LoadingScreen phrase={loadingPhrase} />;

  /* =========================================================
     PRE-GAME SCREENS
  ========================================================= */
  if (screen === "welcome") {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenTransition style={styles.langWrap}>
          <Text style={styles.welcomeKicker}>DISEGNA · INDOVINA · AVANZA</Text>
          <Text style={[styles.welcomeTitle, compactWidth && styles.welcomeTitleCompact]}>Pictionary</Text>
          <Text style={styles.langSub}>Il tabellone da tavolo che sta nel telefono.</Text>

          <View style={styles.welcomeCard}>
            <View style={styles.welcomeStep}><Text style={styles.welcomeStepNumber}>2–4</Text><Text style={styles.welcomeStepText}>squadre</Text></View>
            <View style={styles.welcomeStep}><Text style={styles.welcomeStepNumber}>60</Text><Text style={styles.welcomeStepText}>caselle</Text></View>
            <View style={styles.welcomeStep}><Text style={styles.welcomeStepNumber}>5</Text><Text style={styles.welcomeStepText}>categorie</Text></View>
          </View>

          <SoftButton haptic onPress={() => goWithLoading("menu")} style={{ marginTop: 18, backgroundColor: COLORS.durationBg }}>
            <Text style={[styles.primaryText, { color: COLORS.c3 }]}>Configura la partita</Text>
          </SoftButton>
        </ScreenTransition>
      </SafeAreaView>
    );
  }

  if (screen === "settings") {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenTransition style={{ flex: 1, paddingTop: 18 }}>
          <View style={styles.settingsHeader}>
            <SoftButton onPress={() => go("menu")} haptic style={styles.iconCircleBtn}>
              <Text style={styles.iconCircleText}>←</Text>
            </SoftButton>

            <Text style={styles.settingsTitle}>Preferenze</Text>
            <View style={{ width: 54 }} />
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 26 }} showsVerticalScrollIndicator={false}>
            <View style={styles.settingsOuterCard}>
              <View style={styles.settingsGroup}>
                <Text style={styles.settingsGroupTitle}>Feedback del dispositivo</Text>
                <View style={[styles.settingsInner, { borderColor: COLORS.difficultyBg }]}>
                  <View style={[styles.settingRow, { borderColor: COLORS.difficultyBg }]}>
                    <Text style={styles.settingRowLabel}>Vibrazione</Text>
                    <Switch
                      value={vibrationOn}
                      onValueChange={setVibrationOn}
                      trackColor={{ false: "rgba(0,0,0,0.15)", true: COLORS.difficultyBg }}
                      thumbColor={vibrationOn ? COLORS.c3 : "#F2F2F2"}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.settingsGroup}>
                <Text style={styles.settingsGroupTitle}>Cosa gestisce l’app</Text>
                <View style={[styles.settingsInner, { borderColor: COLORS.c4 }]}>
                  <Text style={styles.settingsCopy}>Tabellone, dado, parole, categorie, timer e avanzamento delle pedine.</Text>
                  <Text style={styles.settingsCopy}>Servono ancora fogli o una lavagna e qualcosa con cui disegnare.</Text>
                </View>
              </View>

              <View style={styles.settingsGroup}>
                <Text style={styles.settingsGroupTitle}>Versione</Text>
                <View style={[styles.settingsInner, { borderColor: COLORS.durationBg }]}>
                  <Text style={styles.settingsCopy}>Edizione italiana · 2–4 squadre · gioco locale sullo stesso dispositivo.</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </ScreenTransition>
      </SafeAreaView>
    );
  }

  if (screen === "teams") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1 }} {...teamsPan.panHandlers}>
          <ScreenTransition>
            <View style={styles.teamsTop}>
              <SoftButton
                onPress={() => {
                  Keyboard.dismiss();
                  setTeamNames((previous) => previous.map((name, index) => name.trim() || `Squadra ${index + 1}`));
                  go("menu");
                }}
                style={styles.backBtn}
                haptic
              >
                <Text style={styles.backBtnText}>←</Text>
              </SoftButton>

              <View style={{ flex: 1 }}>
                <Text style={styles.teamsTitle}>Squadre</Text>
                <Text style={styles.teamsSub}>Imposta numero squadre e nomi.</Text>
              </View>
            </View>

            <View style={[styles.card, { marginHorizontal: 18, backgroundColor: COLORS.c3 }]}>
              <View style={[styles.numberTeamsBox, { backgroundColor: COLORS.difficultyBg }]}>
                <Text style={styles.numberTeamsTitle}>Numero squadre</Text>
                <View style={{ width: 170 }}>
                  <Dropdown
                    valueLabel={`${teamCount}`}
                    selectedValue={teamCount}
                    options={[2, 3, 4].map((n) => ({ label: String(n), value: n }))}
                    onPick={(opt) => setTeamCount(opt.value)}
                    darkText
                  />
                </View>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Nomi squadre</Text>

              <ScrollView style={{ maxHeight: 520 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {teamNames.map((name, idx) => {
                  const color = teamPawnColors[idx] || PAWN_CHOICES[idx % 4].color;
                  return (
                    <View key={idx} style={styles.teamBlock}>
                      <Text style={styles.nameLabel}>{`Squadra ${idx + 1}`}</Text>
                      <TextInput
                        ref={(r) => (inputRefs.current[idx] = r)}
                        value={name}
                        onChangeText={(t) => setTeamNames((prev) => prev.map((x, i) => (i === idx ? t : x)))}
                        placeholder="Inserisci nome"
                        placeholderTextColor="rgba(253,240,213,0.75)"
                        style={styles.input}
                        returnKeyType="done"
                        blurOnSubmit
                        selectTextOnFocus
                        onFocus={() => {
                          requestAnimationFrame(() => {
                            const ref = inputRefs.current[idx];
                            if (ref && typeof name === "string") {
                              try {
                                ref.setNativeProps({ selection: { start: 0, end: name.length } });
                              } catch {}
                            }
                          });
                        }}
                      />

                      <Text style={styles.pawnTitle}>Colore pedina</Text>
                      <View style={styles.pawnChoicesRow}>
                        {PAWN_CHOICES.map((p) => {
                          const selected = color === p.color;
                          return (
                            <Pressable
                              key={p.key}
                              onPress={() => {
                                // enforce unique colors
                                const alreadyUsedByOther = teamPawnColors.some(
                                  (c, i) => i !== idx && c === p.color
                                );
                                if (alreadyUsedByOther) {
                                  setPawnWarnOpen(true);
                                  return;
                                }
                                setTeamPawnColors((prev) => prev.map((c, i) => (i === idx ? p.color : c)));
                              }}
                              style={[
                                styles.pawnColorSquare,
                                { backgroundColor: p.color },
                                selected && styles.pawnColorSquareSelected,
                              ]}
                            />
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <SoftButton
                haptic
                onPress={() => {
                  Keyboard.dismiss();
                  go("menu");
                }}
                style={{ marginTop: 18, backgroundColor: COLORS.durationBg }}
              >
                <Text style={[styles.primaryText, { color: COLORS.c3 }]}>Salva</Text>
              </SoftButton>
            </View>

            {/* Pawn uniqueness warning */}
            <Modal visible={pawnWarnOpen} transparent animationType="fade" onRequestClose={() => setPawnWarnOpen(false)}>
              <View style={styles.modalBackdrop}>
                <View style={[styles.warnCard, { backgroundColor: COLORS.c3 }]}>
                  <Text style={styles.warnText}>Le pedine devono essere di colori diversi per ogni squadra</Text>
                  <SoftButton onPress={() => setPawnWarnOpen(false)} haptic style={{ backgroundColor: COLORS.durationBg }}>
                    <Text style={[styles.btnText, { color: COLORS.c3 }]}>Ok</Text>
                  </SoftButton>
                </View>
              </View>
            </Modal>
          </ScreenTransition>
        </View>
      </SafeAreaView>
    );
  }

  /* =========================================================
     MENU
  ========================================================= */
  if (screen === "menu") {
    const difficultyLabel = DIFFICULTIES.find((d) => d.key === difficulty)?.label ?? "Media";
    const durationLabel = formatSecondsLong(turnSeconds);

    return (
      <SafeAreaView style={styles.container}>
        <ScreenTransition style={styles.menuWrap}>
          <View style={styles.menuTopRow}>
            <SoftButton onPress={() => go("settings")} haptic style={styles.iconCircleBtn}>
              <Text style={styles.iconCircleText}>⚙︎</Text>
            </SoftButton>
          </View>

          <Text style={styles.menuTitle}>Impostazioni partita</Text>

          <View style={styles.card}>
            <SoftButton onPress={() => go("teams")} style={[styles.menuTilePressable, { backgroundColor: COLORS.c4 }]} haptic>
              <View style={styles.menuRow}>
                <Text style={styles.menuTileText}>Squadre</Text>
                <Text style={styles.menuTileRight}>›</Text>
              </View>
            </SoftButton>

            <View style={[styles.menuTileStatic, { backgroundColor: COLORS.difficultyBg }]}>
              <Text style={styles.menuTileTextDark}>Difficoltà</Text>
              <View style={styles.menuInlineRight}>
                <Dropdown
                  valueLabel={difficultyLabel}
                  selectedValue={difficulty}
                  options={DIFFICULTIES.map((d) => ({ label: d.label, value: d.key }))}
                  onPick={(opt) => setDifficulty(opt.value)}
                  darkText
                />
              </View>
            </View>

            <View style={[styles.menuTileStatic, { backgroundColor: COLORS.durationBg }]}>
              <Text style={styles.menuTileTextDark}>Durata turno</Text>
              <View style={styles.menuInlineRight}>
                <Dropdown
                  valueLabel={durationLabel}
                  selectedValue={turnSeconds}
                  options={durations.map((s) => ({ label: formatSecondsLong(s), value: s }))}
                  onPick={(opt) => setTurnSeconds(opt.value)}
                  darkText
                />
              </View>
            </View>

            <View style={styles.hintBox}>
              <Text style={styles.hintTextDark}>
                Consigliato per {difficultyLabel}: {formatSecondsLong(recommendedSeconds)}. Puoi comunque cambiarlo.
              </Text>
            </View>

            <SoftButton haptic onPress={startGame} style={{ backgroundColor: COLORS.c2 }}>
              <Text style={styles.primaryText}>Inizia</Text>
            </SoftButton>
          </View>
        </ScreenTransition>
      </SafeAreaView>
    );
  }

  /* =========================================================
     IN-GAME SCREENS HEADER (X + optional i)
  ========================================================= */
  const InGameHeader = ({ showInfo }) => (
    <>
      <View style={styles.gameTopLeft}>
        <SoftButton onPress={openExit} haptic style={styles.iconCircleBtn}>
          <Text style={styles.iconCircleText}>×</Text>
        </SoftButton>
      </View>

      {showInfo ? (
        <View style={styles.gameTopRight}>
          <SoftButton onPress={() => setInfoOpen(true)} haptic style={styles.iconCircleBtn}>
            <Text style={styles.iconCircleText}>i</Text>
          </SoftButton>
        </View>
      ) : null}
    </>
  );

  /* =========================================================
     BOARD (Tabellone)
  ========================================================= */
  if (screen === "board") {
    const currentTeamName = displayTeamName(teamNames[activeTeam], activeTeam);
    const posStr = String(positions[activeTeam] || 1).padStart(2, "0");

    return (
      <SafeAreaView style={styles.container}>
        <ScreenTransition style={{ flex: 1 }}>
          <InGameHeader showInfo />

          <Text style={[styles.boardTitle, compactHeight && styles.boardTitleCompact]}>Tabellone</Text>

          <View style={styles.boardCard}>
            <Text style={styles.boardTurnText}>Tocca a: {currentTeamName}</Text>

            <View
              style={styles.gridWrap}
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                if (h && Math.abs(h - gridH) > 2) setGridH(h);
              }}
            >
              {/* 10 rows x 6 columns */}
              {Array.from({ length: 10 }).map((_, r) => (
                <View key={r} style={[styles.gridRow, { height: cellH }]}>
                  {Array.from({ length: 6 }).map((__, c) => {
                    const n = r * 6 + c + 1; // 1..60
                    const cat = getCategoryByPos(n);
                    const bg = CATEGORY_META[cat].color;

                    // pawns in this cell:
                    const pawnsHere = [];
                    for (let t = 0; t < teamCount; t++) {
                      if ((positions[t] || 1) === n) pawnsHere.push(t);
                    }

                    return (
                      <View key={n} style={[styles.cell, { backgroundColor: bg, height: cellH }]}>
                        <Text style={styles.cellNum}>{n}</Text>

                        {pawnsHere.length ? (
                          <View style={styles.pawnsRow}>
                            {pawnsHere.map((t) => (
                              <Pawn key={t} color={teamPawnColors[t] || PAWN_CHOICES[t % 4].color} size={Math.max(12, cellH * 0.38)} />
                            ))}
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>

            <View style={styles.boardFooter}>
              <View style={styles.boardMetaRow}>
                <Text style={styles.boardMeta}>Ultimo tiro: {lastRoll ? lastRoll : "—"}</Text>
                <Text style={styles.boardMeta}>Posizione: {posStr} / 60</Text>
              </View>
              <View style={styles.boardActionsRow}>
                <SoftButton onPress={onPressRollFromBoard} haptic style={[styles.boardAction, { backgroundColor: COLORS.durationBg }]}>
                  <Text style={styles.boardActionText}>Dado nell’app</Text>
                </SoftButton>
                <SoftButton onPress={() => setPhysicalDiceOpen(true)} haptic style={[styles.boardAction, styles.boardActionSecondary]}>
                  <Text style={[styles.boardActionText, { color: COLORS.white }]}>Dado fisico</Text>
                </SoftButton>
              </View>
            </View>
          </View>

          <ExitModal
            visible={exitOpen}
            onClose={() => setExitOpen(false)}
            onExitToMenu={exitToMenu}
          />

          <InfoModal visible={infoOpen} onClose={() => setInfoOpen(false)} />
          <PhysicalDiceModal visible={physicalDiceOpen} onClose={() => setPhysicalDiceOpen(false)} onSelect={usePhysicalDice} />
        </ScreenTransition>
      </SafeAreaView>
    );
  }

  /* =========================================================
     DICE SCREEN
  ========================================================= */
  if (screen === "dice") {
    const rot = diceSpin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.c3 }]}>
        <ScreenTransition style={{ flex: 1, paddingTop: 18 }}>
          <InGameHeader showInfo={false} />

          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}>
            <Text style={styles.diceTitle}>Tira il dado</Text>

            <Animated.View style={[styles.diceCube, { transform: [{ rotate: rot }] }]}>
              <Text style={styles.diceFaceText}>{diceResult ? String(diceResult) : "•"}</Text>
            </Animated.View>

            <View style={{ height: 26 }} />

            {!diceRolling && !diceResult ? (
              <SoftButton onPress={rollDice} haptic style={{ backgroundColor: COLORS.durationBg, width: 220 }}>
                <Text style={[styles.primaryText, { color: COLORS.c3 }]}>Tira il dado</Text>
              </SoftButton>
            ) : null}

            {diceRolling ? (
              <Text style={styles.diceHint}>…</Text>
            ) : null}

            {diceResult ? (
              <Text style={styles.diceResultText}>{diceResult}!</Text>
            ) : null}
          </View>

          <ExitModal
            visible={exitOpen}
            onClose={() => setExitOpen(false)}
            onExitToMenu={exitToMenu}
          />
        </ScreenTransition>
      </SafeAreaView>
    );
  }

  /* =========================================================
     CATEGORY / WORD SCREEN
  ========================================================= */
  if (screen === "category") {
    const catMeta = CATEGORY_META[pendingCategory] || CATEGORY_META.yellow;

    return (
      <SafeAreaView style={styles.container}>
        <ScreenTransition style={{ flex: 1, paddingTop: 18 }}>
          <InGameHeader showInfo={false} />

          <View style={{ flex: 1, paddingHorizontal: 18, justifyContent: "center" }}>
            <View style={[styles.categoryCard, { backgroundColor: COLORS.c3 }]}>
              <Text style={styles.categoryTop}>La tua categoria è:</Text>
              <Text style={styles.categoryName}>{catMeta.short}</Text>

              <Pressable
                onPress={() => setWordShown((s) => !s)}
                style={styles.coveredWord}
              >
                <Text style={styles.coveredWordText}>
                  {wordShown ? pendingWord : "Scopri la parola"}
                </Text>
              </Pressable>

              <Text style={styles.coveredWordHint}>Mostra la parola solo a chi disegna.</Text>

              <SoftButton onPress={goToTimer} haptic disabled={!wordShown} style={{ backgroundColor: COLORS.durationBg }}>
                <Text style={[styles.primaryText, { color: COLORS.c3 }]}>Disegna</Text>
              </SoftButton>
            </View>
          </View>

          <ExitModal
            visible={exitOpen}
            onClose={() => setExitOpen(false)}
            onExitToMenu={exitToMenu}
          />
        </ScreenTransition>
      </SafeAreaView>
    );
  }

  /* =========================================================
     TIMER SCREEN
  ========================================================= */
  if (screen === "timer") {
    const catMeta = CATEGORY_META[pendingCategory] || CATEGORY_META.yellow;
    const isRed15 = timerLeft <= 15;
    const isPulse = timerLeft <= 30;

    const scale = isPulse
      ? pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] })
      : 1;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: catMeta.color }]}>
        <ScreenTransition style={{ flex: 1, paddingTop: 18 }}>
          <InGameHeader showInfo={false} />

          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}>
            <Animated.Text
              style={[
                styles.timerText,
                { color: isRed15 ? COLORS.c2 : COLORS.white },
                { transform: [{ scale }] },
              ]}
            >
              {formatMMSS(timerLeft)}
            </Animated.Text>
          </View>

          <View style={styles.timerBottom}>
            <SoftButton onPress={() => resolveTurn(true)} haptic style={{ backgroundColor: COLORS.durationBg, width: "92%" }}>
              <Text style={[styles.primaryText, { color: COLORS.c3 }]}>Indovinato</Text>
            </SoftButton>
          </View>

          <ExitModal
            visible={exitOpen}
            onClose={() => setExitOpen(false)}
            onExitToMenu={exitToMenu}
          />
        </ScreenTransition>
      </SafeAreaView>
    );
  }

  /* =========================================================
     TIMEOUT SCREEN (two buttons)
  ========================================================= */
  if (screen === "timeout") {
    const catMeta = CATEGORY_META[pendingCategory] || CATEGORY_META.yellow;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: catMeta.color }]}>
        <ScreenTransition style={{ flex: 1, paddingTop: 18 }}>
          <InGameHeader showInfo={false} />

          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}>
            <View style={{ alignItems: "center", marginBottom: 18 }}>
              <Text style={[styles.timeoutText, { color: COLORS.white }]}>
                Tempo{" "}
                <Text style={{ color: COLORS.c2 }}>scaduto!</Text>
              </Text>
            </View>

            <SoftButton
              onPress={() => resolveTurn(true)}
              haptic
              style={{ backgroundColor: COLORS.durationBg, width: "86%", marginBottom: 12 }}
            >
              <Text style={[styles.primaryText, { color: COLORS.c3 }]}>Parola indovinata</Text>
            </SoftButton>

            <SoftButton
              onPress={() => resolveTurn(false)}
              haptic
              style={{ backgroundColor: COLORS.c2, width: "86%" }}
            >
              <Text style={styles.primaryText}>Parola non indovinata</Text>
            </SoftButton>
          </View>

          <ExitModal
            visible={exitOpen}
            onClose={() => setExitOpen(false)}
            onExitToMenu={exitToMenu}
          />
        </ScreenTransition>
      </SafeAreaView>
    );
  }

  /* =========================================================
     WIN SCREEN
  ========================================================= */
  if (screen === "win") {
    const winner = displayTeamName(teamNames[activeTeam], activeTeam);
    return (
      <SafeAreaView style={styles.container}>
        <ScreenTransition style={{ flex: 1, paddingTop: 18 }}>
          <InGameHeader showInfo={false} />

          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}>
            <View style={[styles.winCard, { backgroundColor: COLORS.c3 }]}>
              <Text style={styles.winTitle}>Vittoria!</Text>
              <Text style={styles.winSub}>{winner} ha raggiunto la casella 60.</Text>

              <SoftButton onPress={exitToMenu} haptic style={{ backgroundColor: COLORS.durationBg, marginTop: 16 }}>
                <Text style={[styles.primaryText, { color: COLORS.c3 }]}>Torna al menu</Text>
              </SoftButton>
            </View>
          </View>

          <ExitModal
            visible={exitOpen}
            onClose={() => setExitOpen(false)}
            onExitToMenu={exitToMenu}
          />
        </ScreenTransition>
      </SafeAreaView>
    );
  }

  // Fallback
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>—</Text>
      </View>
    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
========================================================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Base button
  btnBase: {
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.c4,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 18,
    textShadowColor: "rgba(0,0,0,0.20)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  primaryText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 22,
    textShadowColor: "rgba(0,0,0,0.22)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Loading
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18 },
  loadingCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: COLORS.c3,
    borderRadius: 22,
    padding: 18,
    alignItems: "center",
  },
  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: COLORS.bg,
    opacity: 0.18,
    marginBottom: 12,
  },
  loadingTitle: { color: COLORS.white, fontWeight: "900", fontSize: 18 },
  loadingPhrase: {
    color: "rgba(255,255,255,0.88)",
    marginTop: 8,
    textAlign: "center",
    fontWeight: "800",
    fontSize: 16,
  },

  // Icon circle
  iconCircleBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.c3,
    paddingVertical: 0,
    paddingHorizontal: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleText: { color: COLORS.white, fontWeight: "900", fontSize: 22 },

  // Welcome
  langWrap: { flex: 1, padding: 18, paddingTop: 28, justifyContent: "center" },
  langTitle: { fontSize: 28, fontWeight: "900", color: COLORS.c3, textAlign: "center" },
  langSub: { marginTop: 6, color: COLORS.c1, fontWeight: "800", fontSize: 16, textAlign: "center" },
  welcomeKicker: { color: COLORS.c2, fontWeight: "900", fontSize: 14, letterSpacing: 1.8, textAlign: "center" },
  welcomeTitle: { color: COLORS.c3, fontWeight: "900", fontSize: 52, textAlign: "center", marginTop: 8 },
  welcomeTitleCompact: { fontSize: 44 },
  welcomeCard: {
    marginTop: 22,
    backgroundColor: COLORS.c3,
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    gap: 10,
  },
  welcomeStep: { flex: 1, backgroundColor: "rgba(255,255,255,0.10)", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  welcomeStepNumber: { color: COLORS.durationBg, fontWeight: "900", fontSize: 30 },
  welcomeStepText: { color: COLORS.white, fontWeight: "800", fontSize: 14, marginTop: 2 },

  // Shared card
  card: { backgroundColor: COLORS.c3, borderRadius: 22, padding: 14, marginHorizontal: 18 },

  // Menu
  menuWrap: { flex: 1, paddingTop: 18, justifyContent: "center" },
  menuTopRow: { position: "absolute", top: 18, left: 18, zIndex: 10 },
  menuTitle: { fontSize: 32, fontWeight: "900", color: COLORS.c3, textAlign: "center", marginBottom: 14 },
  menuRow: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  menuTilePressable: { borderRadius: 18, paddingVertical: 20, paddingHorizontal: 16, marginBottom: 12 },
  menuTileStatic: {
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuTileText: { color: COLORS.white, fontWeight: "900", fontSize: 22 },
  menuTileTextDark: { color: COLORS.c3, fontWeight: "900", fontSize: 22 },
  menuTileRight: { color: COLORS.white, fontSize: 24, fontWeight: "900" },
  menuInlineRight: { width: 160 },
  hintBox: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 14,
    marginTop: 2,
    marginBottom: 14,
  },
  hintTextDark: { color: "rgba(253,240,213,0.95)", fontWeight: "900", fontSize: 16 },

  // Dropdown
  dropdownRow: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  dropdownValue: { color: COLORS.white, fontWeight: "900", fontSize: 20, textAlign: "center" },
  chev: { color: "rgba(255,255,255,0.85)", fontWeight: "900", fontSize: 20 },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: { width: "100%", maxWidth: 520, backgroundColor: COLORS.c3, borderRadius: 22, padding: 14 },
  optionRow: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  optionRowSelected: { backgroundColor: "rgba(255,255,255,0.10)", borderRadius: 12 },
  optionText: { color: COLORS.white, fontWeight: "900", fontSize: 20, textAlign: "center" },
  optionTextSelected: { fontSize: 22, transform: [{ scale: 1.03 }] },

  // Teams
  teamsTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginTop: 12,
    marginBottom: 10,
    gap: 12,
  },
  teamsTitle: { color: COLORS.c3, fontSize: 32, fontWeight: "900" },
  teamsSub: { color: COLORS.c1, marginTop: 2, fontWeight: "800", fontSize: 18 },
  backBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.c3,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 0,
  },
  backBtnText: { color: COLORS.white, fontSize: 20, fontWeight: "900" },

  numberTeamsBox: {
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  numberTeamsTitle: { color: COLORS.c3, fontWeight: "900", fontSize: 24, marginBottom: 12 },

  sectionTitle: { color: COLORS.white, fontWeight: "900", fontSize: 26, marginBottom: 12 },

  teamBlock: { marginBottom: 18 },
  nameLabel: { color: "rgba(255,255,255,0.92)", marginBottom: 10, fontWeight: "900", fontSize: 20 },
  input: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 18,
  },
  pawnTitle: { marginTop: 12, color: "rgba(255,255,255,0.92)", fontWeight: "900", fontSize: 18 },
  pawnChoicesRow: { flexDirection: "row", gap: 12, marginTop: 10 },
  pawnColorSquare: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.30)",
  },
  pawnColorSquareSelected: {
    borderColor: COLORS.white,
    transform: [{ scale: 1.08 }],
  },

  warnCard: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 22,
    padding: 16,
    gap: 14,
  },
  warnText: { color: COLORS.white, fontWeight: "900", fontSize: 18, textAlign: "center" },

  // Settings
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  settingsTitle: { fontSize: 32, fontWeight: "900", color: COLORS.c3, textAlign: "center" },
  settingsOuterCard: {
    backgroundColor: COLORS.c3,
    borderRadius: 22,
    padding: 14,
  },
  settingsGroup: {
    backgroundColor: COLORS.c3,
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
  },
  settingsGroupTitle: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 20,
    marginBottom: 12,
  },
  settingsInner: {
    borderWidth: 2,
    borderRadius: 18,
    padding: 12,
  },
  settingRow: {
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  settingRowLabel: { color: COLORS.white, fontWeight: "900", fontSize: 18 },
  settingsCopy: { color: COLORS.white, fontWeight: "800", fontSize: 17, lineHeight: 24, marginBottom: 10 },

  // In-game header anchors
  gameTopLeft: { position: "absolute", top: 18, left: 18, zIndex: 50 },
  gameTopRight: { position: "absolute", top: 18, right: 18, zIndex: 50 },

  // Exit modal
  exitCard: {
    width: "100%",
    maxWidth: 560,
    borderRadius: 26,
    padding: 18,
  },
  exitTitle: { color: COLORS.white, fontWeight: "900", fontSize: 30, textAlign: "center" },
  exitButtonsRow: { flexDirection: "row", gap: 14, marginTop: 18 },
  exitBtn: { flex: 1, borderRadius: 18, paddingVertical: 16 },
  exitBtnText: { color: COLORS.white, fontWeight: "900", fontSize: 22, textAlign: "center" },

  // Physical die
  physicalDiceCard: { width: "100%", maxWidth: 440, borderRadius: 26, padding: 20, backgroundColor: COLORS.bg },
  physicalDiceTitle: { color: COLORS.c3, fontWeight: "900", fontSize: 28, textAlign: "center" },
  physicalDiceCopy: { color: COLORS.c1, fontWeight: "800", fontSize: 16, lineHeight: 22, textAlign: "center", marginTop: 8 },
  physicalDiceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 20 },
  physicalDiceChoice: { width: "31%", aspectRatio: 1, borderRadius: 18, backgroundColor: COLORS.c3, alignItems: "center", justifyContent: "center" },
  physicalDiceChoiceText: { color: COLORS.white, fontWeight: "900", fontSize: 34 },
  physicalDiceCancel: { alignSelf: "center", paddingVertical: 12, paddingHorizontal: 18, marginTop: 10 },
  physicalDiceCancelText: { color: COLORS.c2, fontWeight: "900", fontSize: 17 },

  // Info modal
  infoCard: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 22,
    padding: 16,
  },
  infoClose: { position: "absolute", top: 10, right: 12, zIndex: 10 },
  infoCloseText: { color: COLORS.c3, fontWeight: "900", fontSize: 30 },
  infoTitle: { color: COLORS.c3, fontWeight: "900", fontSize: 28, textAlign: "center" },
  infoSectionTitle: { color: COLORS.c1, fontWeight: "900", fontSize: 18, marginTop: 16 },
  rulesSummary: { marginTop: 16, gap: 8 },
  rulesSummaryText: { color: COLORS.c3, fontWeight: "800", fontSize: 15, lineHeight: 21 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoSquare: { width: 20, height: 20, borderRadius: 6 },
  infoText: { color: COLORS.c3, fontWeight: "900", fontSize: 18 },

  // Board
  boardTitle: { marginTop: 86, fontSize: 34, fontWeight: "900", color: COLORS.c3, textAlign: "center" },
  boardTitleCompact: { marginTop: 70, fontSize: 29 },
  boardCard: {
    marginTop: 14,
    marginHorizontal: 18,
    backgroundColor: COLORS.c3,
    borderRadius: 26,
    padding: 14,
    flex: 1,
  },
  boardTurnText: { color: COLORS.white, fontWeight: "900", fontSize: 24, textAlign: "center", marginBottom: 10 },

  gridWrap: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 18,
    overflow: "hidden",
  },
  gridRow: { flexDirection: "row" },
  cell: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    paddingTop: 6,
    paddingLeft: 8,
  },
  cellNum: { color: COLORS.c3, fontWeight: "900", fontSize: 18 },
  pawnsRow: { position: "absolute", left: 6, bottom: 6, flexDirection: "row", gap: 6 },

  boardFooter: { gap: 10, marginTop: 10 },
  boardMetaRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  boardMeta: { color: "rgba(255,255,255,0.92)", fontWeight: "900", fontSize: 15 },
  boardActionsRow: { flexDirection: "row", gap: 8 },
  boardAction: { flex: 1, borderRadius: 15, paddingVertical: 12, paddingHorizontal: 8 },
  boardActionSecondary: { backgroundColor: COLORS.c4, shadowOpacity: 0.08 },
  boardActionText: { color: COLORS.c3, fontWeight: "900", fontSize: 16, textAlign: "center" },

  // Dice
  diceTitle: { color: COLORS.white, fontWeight: "900", fontSize: 34, marginBottom: 18 },
  diceCube: {
    width: 150,
    height: 150,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  diceFaceText: { color: COLORS.white, fontWeight: "900", fontSize: 52 },
  diceHint: { color: "rgba(255,255,255,0.80)", fontWeight: "900", fontSize: 22, marginTop: 10 },
  diceResultText: { color: COLORS.durationBg, fontWeight: "900", fontSize: 60, marginTop: 12 },

  // Category
  categoryCard: {
    borderRadius: 26,
    padding: 18,
  },
  categoryTop: { color: "rgba(255,255,255,0.90)", fontWeight: "900", fontSize: 22, textAlign: "center" },
  categoryName: { color: COLORS.white, fontWeight: "900", fontSize: 34, textAlign: "center", marginTop: 6, marginBottom: 16 },
  coveredWord: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  coveredWordText: { color: COLORS.white, fontWeight: "900", fontSize: 22, textAlign: "center" },
  coveredWordHint: { color: "rgba(255,255,255,0.78)", fontWeight: "800", fontSize: 14, textAlign: "center", marginBottom: 14 },

  // Timer
  timerText: {
    fontSize: 86,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  timerBottom: { paddingBottom: 22, alignItems: "center", justifyContent: "center" },

  // Timeout
  timeoutText: { fontWeight: "900", fontSize: 44, textAlign: "center" },

  // Win
  winCard: { width: "100%", maxWidth: 520, borderRadius: 26, padding: 18 },
  winTitle: { color: COLORS.white, fontWeight: "900", fontSize: 40, textAlign: "center" },
  winSub: { color: "rgba(255,255,255,0.88)", fontWeight: "900", fontSize: 18, textAlign: "center", marginTop: 10 },
});
