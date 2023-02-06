const axios = require('axios');
const HttpsProxyAgent = require("https-proxy-agent");
const fs = require('fs');
const readline = require('readline');
const events = require('events');
let notify;
try {
    notify = require('./sendNotify');
} catch (e) {}

let Version = '2.4.1';

//自定义
//Cookie
let Cookie = process.env.BingAutoSearch_MicroSoft_COOKIE || "";
Cookie = Cookie.replace(/[^\x00-\xff]/g, '');

//每次搜索间隔秒数
let sleep_sec = process.env.BingAutoSearch_sleep_sec || 5;

//HTTP proxy
let proxy = process.env.BingAutoSearch_proxy || "";

//User-Agent
const edgeUserAgents = ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.70","Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.61","Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.46","Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.46","Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.54","Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.76","Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.54","Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.61","Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.56"];
const mobileUserAgents = ["Mozilla/5.0 (iPhone; CPU iPhone OS 13_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.5 Mobile/15E148 Snapchat/10.77.5.59 (like Safari/604.1)","Mozilla/5.0 (Linux; Android 13; Redmi 4X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Mobile Safari/537.36 EdgA/108.0.1462.54","Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X; zh-CN) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 MQQBrowser/13.6.0 Mobile/20B82 UCBrowser/15.2.5.2003 Mobile AliApp(TUnionSDK/0.1.20.4) Safari/604.1 QBWebViewUA/2 QBWebViewType/1 WKType/1","Mozilla/5.0 (Linux; Android 13; SM-G9810 Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/78.0.3904.62 XWEB/2889 MMWEBSDK/20210902 Mobile Safari/537.36 MMWEBID/6261 MicroMessenger/8.0.15.2001(0x28000F41) Process/toolsmp WeChat/arm64 Weixin GPVersion/1 NetType/WIFI Language/zh_CN ABI/arm64","Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X; zh-CN) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/20B82 UCBrowser/15.2.5.2003 Mobile AliApp(TUnionSDK/0.1.20.4)","Mozilla/5.0 (Linux; Android 10; AWM-A0 Build/G66T2106150CN00MQ6; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/4375 MMWEBSDK/20221109 Mobile Safari/537.36 MMWEBID/6678 MicroMessenger/8.0.31.2280(0x28001F3B) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64","Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile DuckDuckGo/5 Safari/537.36","Mozilla/5.0 (Linux; Android 12; M2011K2C Build/SKQ1.211006.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/88.0.4324.181 Mobile Safari/537.36 Lark/5.31.0-alpha1 LarkLocale/en_US ChannelName/Feishu LarkEnv/1_eu_nc TTWebView/0881130045509","Mozilla/5.0 (Linux; Android 12; M2011K2C Build/Xiaomi M2011K2C; wv) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.91 Mobile Safari/537.36 Lark/5.31.0-alpha1 LarkLocale/zh_CN ChannelName/Feishu LarkEnv/1_eu_nc TTWebView/0751130016582","Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1"];
let edgeUserAgent = process.env.BingAutoSearch_edgeUserAgent || edgeUserAgents[parseInt(Math.random() * edgeUserAgents.length)];
let mobileUserAgent = process.env.BingAutoSearch_mobileUserAgent || mobileUserAgents[parseInt(Math.random() * mobileUserAgents.length)];

//搜索内容
const wordlists = process.env.BingAutoSearch_wordlists || ["abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent", "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter", "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique", "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset", "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction", "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake", "aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge", "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain", "barrel", "base", "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become", "beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit", "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology", "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless", "blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body", "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss", "bottom", "bounce", "box", "boy", "bracket", "brain", "brand", "brass", "brave", "bread", "breeze", "brick", "bridge", "brief", "bright", "bring", "brisk", "broccoli", "broken", "bronze", "broom", "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb", "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy", "butter", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call", "calm", "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe", "canvas", "canyon", "capable", "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry", "cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch", "category", "cattle", "caught", "cause", "caution", "cave", "ceiling", "celery", "cement", "census", "century", "cereal", "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase", "chat", "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child", "chimney", "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinnamon", "circle", "citizen", "city", "civil", "claim", "clap", "clarify", "claw", "clay", "clean", "clerk", "clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close", "cloth", "cloud", "clown", "club", "clump", "cluster", "clutch", "coach", "coast", "coconut", "code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come", "comfort", "comic", "common", "company", "concert", "conduct", "confirm", "congress", "connect", "consider", "control", "convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct", "cost", "cotton", "couch", "country", "couple", "course", "cousin", "cover", "coyote", "crack", "cradle", "craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek", "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd", "crucial", "cruel", "cruise", "crumble", "crunch", "crush", "cry", "crystal", "cube", "culture", "cup", "cupboard", "curious", "current", "curtain", "curve", "cushion", "custom", "cute", "cycle", "dad", "damage", "damp", "dance", "danger", "daring", "dash", "daughter", "dawn", "day", "deal", "debate", "debris", "decade", "december", "decide", "decline", "decorate", "decrease", "deer", "defense", "define", "defy", "degree", "delay", "deliver", "demand", "demise", "denial", "dentist", "deny", "depart", "depend", "deposit", "depth", "deputy", "derive", "describe", "desert", "design", "desk", "despair", "destroy", "detail", "detect", "develop", "device", "devote", "diagram", "dial", "diamond", "diary", "dice", "diesel", "diet", "differ", "digital", "dignity", "dilemma", "dinner", "dinosaur", "direct", "dirt", "disagree", "discover", "disease", "dish", "dismiss", "disorder", "display", "distance", "divert", "divide", "divorce", "dizzy", "doctor", "document", "dog", "doll", "dolphin", "domain", "donate", "donkey", "donor", "door", "dose", "double", "dove", "draft", "dragon", "drama", "drastic", "draw", "dream", "dress", "drift", "drill", "drink", "drip", "drive", "drop", "drum", "dry", "duck", "dumb", "dune", "during", "dust", "dutch", "duty", "dwarf", "dynamic", "eager", "eagle", "early", "earn", "earth", "easily", "east", "easy", "echo", "ecology", "economy", "edge", "edit", "educate", "effort", "egg", "eight", "either", "elbow", "elder", "electric", "elegant", "element", "elephant", "elevator", "elite", "else", "embark", "embody", "embrace", "emerge", "emotion", "employ", "empower", "empty", "enable", "enact", "end", "endless", "endorse", "enemy", "energy", "enforce", "engage", "engine", "enhance", "enjoy", "enlist", "enough", "enrich", "enroll", "ensure", "enter", "entire", "entry", "envelope", "episode", "equal", "equip", "era", "erase", "erode", "erosion", "error", "erupt", "escape", "essay", "essence", "estate", "eternal", "ethics", "evidence", "evil", "evoke", "evolve", "exact", "example", "excess", "exchange", "excite", "exclude", "excuse", "execute", "exercise", "exhaust", "exhibit", "exile", "exist", "exit", "exotic", "expand", "expect", "expire", "explain", "expose", "express", "extend", "extra", "eye", "eyebrow", "fabric", "face", "faculty", "fade", "faint", "faith", "fall", "false", "fame", "family", "famous", "fan", "fancy", "fantasy", "farm", "fashion", "fat", "fatal", "father", "fatigue", "fault", "favorite", "feature", "february", "federal", "fee", "feed", "feel", "female", "fence", "festival", "fetch", "fever", "few", "fiber", "fiction", "field", "figure", "file", "film", "filter", "final", "find", "fine", "finger", "finish", "fire", "firm", "first", "fiscal", "fish", "fit", "fitness", "fix", "flag", "flame", "flash", "flat", "flavor", "flee", "flight", "flip", "float", "flock", "floor", "flower", "fluid", "flush", "fly", "foam", "focus", "fog", "foil", "fold", "follow", "food", "foot", "force", "forest", "forget", "fork", "fortune", "forum", "forward", "fossil", "foster", "found", "fox", "fragile", "frame", "frequent", "fresh", "friend", "fringe", "frog", "front", "frost", "frown", "frozen", "fruit", "fuel", "fun", "funny", "furnace", "fury", "future", "gadget", "gain", "galaxy", "gallery", "game", "gap", "garage", "garbage", "garden", "garlic", "garment", "gas", "gasp", "gate", "gather", "gauge", "gaze", "general", "genius", "genre", "gentle", "genuine", "gesture", "ghost", "giant", "gift", "giggle", "ginger", "giraffe", "girl", "give", "glad", "glance", "glare", "glass", "glide", "glimpse", "globe", "gloom", "glory", "glove", "glow", "glue", "goat", "goddess", "gold", "good", "goose", "gorilla", "gospel", "gossip", "govern", "gown", "grab", "grace", "grain", "grant", "grape", "grass", "gravity", "great", "green", "grid", "grief", "grit", "grocery", "group", "grow", "grunt", "guard", "guess", "guide", "guilt", "guitar", "gun", "gym", "habit", "hair", "half", "hammer", "hamster", "hand", "happy", "harbor", "hard", "harsh", "harvest", "hat", "have", "hawk", "hazard", "head", "health", "heart", "heavy", "hedgehog", "height", "hello", "helmet", "help", "hen", "hero", "hidden", "high", "hill", "hint", "hip", "hire", "history", "hobby", "hockey", "hold", "hole", "holiday", "hollow", "home", "honey", "hood", "hope", "horn", "horror", "horse", "hospital", "host", "hotel", "hour", "hover", "hub", "huge", "human", "humble", "humor", "hundred", "hungry", "hunt", "hurdle", "hurry", "hurt", "husband", "hybrid", "ice", "icon", "idea", "identify", "idle", "ignore", "ill", "illegal", "illness", "image", "imitate", "immense", "immune", "impact", "impose", "improve", "impulse", "inch", "include", "income", "increase", "index", "indicate", "indoor", "industry", "infant", "inflict", "inform", "inhale", "inherit", "initial", "inject", "injury", "inmate", "inner", "innocent", "input", "inquiry", "insane", "insect", "inside", "inspire", "install", "intact", "interest", "into", "invest", "invite", "involve", "iron", "island", "isolate", "issue", "item", "ivory", "jacket", "jaguar", "jar", "jazz", "jealous", "jeans", "jelly", "jewel", "job", "join", "joke", "journey", "joy", "judge", "juice", "jump", "jungle", "junior", "junk", "just", "kangaroo", "keen", "keep", "ketchup", "key", "kick", "kid", "kidney", "kind", "kingdom", "kiss", "kit", "kitchen", "kite", "kitten", "kiwi", "knee", "knife", "knock", "know", "lab", "label", "labor", "ladder", "lady", "lake", "lamp", "language", "laptop", "large", "later", "latin", "laugh", "laundry", "lava", "law", "lawn", "lawsuit", "layer", "lazy", "leader", "leaf", "learn", "leave", "lecture", "left", "leg", "legal", "legend", "leisure", "lemon", "lend", "length", "lens", "leopard", "lesson", "letter", "level", "liar", "liberty", "library", "license", "life", "lift", "light", "like", "limb", "limit", "link", "lion", "liquid", "list", "little", "live", "lizard", "load", "loan", "lobster", "local", "lock", "logic", "lonely", "long", "loop", "lottery", "loud", "lounge", "love", "loyal", "lucky", "luggage", "lumber", "lunar", "lunch", "luxury", "lyrics", "machine", "mad", "magic", "magnet", "maid", "mail", "main", "major", "make", "mammal", "man", "manage", "mandate", "mango", "mansion", "manual", "maple", "marble", "march", "margin", "marine", "market", "marriage", "mask", "mass", "master", "match", "material", "math", "matrix", "matter", "maximum", "maze", "meadow", "mean", "measure", "meat", "mechanic", "medal", "media", "melody", "melt", "member", "memory", "mention", "menu", "mercy", "merge", "merit", "merry", "mesh", "message", "metal", "method", "middle", "midnight", "milk", "million", "mimic", "mind", "minimum", "minor", "minute", "miracle", "mirror", "misery", "miss", "mistake", "mix", "mixed", "mixture", "mobile", "model", "modify", "mom", "moment", "monitor", "monkey", "monster", "month", "moon", "moral", "more", "morning", "mosquito", "mother", "motion", "motor", "mountain", "mouse", "move", "movie", "much", "muffin", "mule", "multiply", "muscle", "museum", "mushroom", "music", "must", "mutual", "myself", "mystery", "myth", "naive", "name", "napkin", "narrow", "nasty", "nation", "nature", "near", "neck", "need", "negative", "neglect", "neither", "nephew", "nerve", "nest", "net", "network", "neutral", "never", "news", "next", "nice", "night", "noble", "noise", "nominee", "noodle", "normal", "north", "nose", "notable", "note", "nothing", "notice", "novel", "now", "nuclear", "number", "nurse", "nut", "oak", "obey", "object", "oblige", "obscure", "observe", "obtain", "obvious", "occur", "ocean", "october", "odor", "off", "offer", "office", "often", "oil", "okay", "old", "olive", "olympic", "omit", "once", "one", "onion", "online", "only", "open", "opera", "opinion", "oppose", "option", "orange", "orbit", "orchard", "order", "ordinary", "organ", "orient", "original", "orphan", "ostrich", "other", "outdoor", "outer", "output", "outside", "oval", "oven", "over", "own", "owner", "oxygen", "oyster", "ozone", "pact", "paddle", "page", "pair", "palace", "palm", "panda", "panel", "panic", "panther", "paper", "parade", "parent", "park", "parrot", "party", "pass", "patch", "path", "patient", "patrol", "pattern", "pause", "pave", "payment", "peace", "peanut", "pear", "peasant", "pelican", "pen", "penalty", "pencil", "people", "pepper", "perfect", "permit", "person", "pet", "phone", "photo", "phrase", "physical", "piano", "picnic", "picture", "piece", "pig", "pigeon", "pill", "pilot", "pink", "pioneer", "pipe", "pistol", "pitch", "pizza", "place", "planet", "plastic", "plate", "play", "please", "pledge", "pluck", "plug", "plunge", "poem", "poet", "point", "polar", "pole", "police", "pond", "pony", "pool", "popular", "portion", "position", "possible", "post", "potato", "pottery", "poverty", "powder", "power", "practice", "praise", "predict", "prefer", "prepare", "present", "pretty", "prevent", "price", "pride", "primary", "print", "priority", "prison", "private", "prize", "problem", "process", "produce", "profit", "program", "project", "promote", "proof", "property", "prosper", "protect", "proud", "provide", "public", "pudding", "pull", "pulp", "pulse", "pumpkin", "punch", "pupil", "puppy", "purchase", "purity", "purpose", "purse", "push", "put", "puzzle", "pyramid", "quality", "quantum", "quarter", "question", "quick", "quit", "quiz", "quote", "rabbit", "raccoon", "race", "rack", "radar", "radio", "rail", "rain", "raise", "rally", "ramp", "ranch", "random", "range", "rapid", "rare", "rate", "rather", "raven", "raw", "razor", "ready", "real", "reason", "rebel", "rebuild", "recall", "receive", "recipe", "record", "recycle", "reduce", "reflect", "reform", "refuse", "region", "regret", "regular", "reject", "relax", "release", "relief", "rely", "remain", "remember", "remind", "remove", "render", "renew", "rent", "reopen", "repair", "repeat", "replace", "report", "require", "rescue", "resemble", "resist", "resource", "response", "result", "retire", "retreat", "return", "reunion", "reveal", "review", "reward", "rhythm", "rib", "ribbon", "rice", "rich", "ride", "ridge", "rifle", "right", "rigid", "ring", "riot", "ripple", "risk", "ritual", "rival", "river", "road", "roast", "robot", "robust", "rocket", "romance", "roof", "rookie", "room", "rose", "rotate", "rough", "round", "route", "royal", "rubber", "rude", "rug", "rule", "run", "runway", "rural", "sad", "saddle", "sadness", "safe", "sail", "salad", "salmon", "salon", "salt", "salute", "same", "sample", "sand", "satisfy", "satoshi", "sauce", "sausage", "save", "say", "scale", "scan", "scare", "scatter", "scene", "scheme", "school", "science", "scissors", "scorpion", "scout", "scrap", "screen", "script", "scrub", "sea", "search", "season", "seat", "second", "secret", "section", "security", "seed", "seek", "segment", "select", "sell", "seminar", "senior", "sense", "sentence", "series", "service", "session", "settle", "setup", "seven", "shadow", "shaft", "shallow", "share", "shed", "shell", "sheriff", "shield", "shift", "shine", "ship", "shiver", "shock", "shoe", "shoot", "shop", "short", "shoulder", "shove", "shrimp", "shrug", "shuffle", "shy", "sibling", "sick", "side", "siege", "sight", "sign", "silent", "silk", "silly", "silver", "similar", "simple", "since", "sing", "siren", "sister", "situate", "six", "size", "skate", "sketch", "ski", "skill", "skin", "skirt", "skull", "slab", "slam", "sleep", "slender", "slice", "slide", "slight", "slim", "slogan", "slot", "slow", "slush", "small", "smart", "smile", "smoke", "smooth", "snack", "snake", "snap", "sniff", "snow", "soap", "soccer", "social", "sock", "soda", "soft", "solar", "soldier", "solid", "solution", "solve", "someone", "song", "soon", "sorry", "sort", "soul", "sound", "soup", "source", "south", "space", "spare", "spatial", "spawn", "speak", "special", "speed", "spell", "spend", "sphere", "spice", "spider", "spike", "spin", "spirit", "split", "spoil", "sponsor", "spoon", "sport", "spot", "spray", "spread", "spring", "spy", "square", "squeeze", "squirrel", "stable", "stadium", "staff", "stage", "stairs", "stamp", "stand", "start", "state", "stay", "steak", "steel", "stem", "step", "stereo", "stick", "still", "sting", "stock", "stomach", "stone", "stool", "story", "stove", "strategy", "street", "strike", "strong", "struggle", "student", "stuff", "stumble", "style", "subject", "submit", "subway", "success", "such", "sudden", "suffer", "sugar", "suggest", "suit", "summer", "sun", "sunny", "sunset", "super", "supply", "supreme", "sure", "surface", "surge", "surprise", "surround", "survey", "suspect", "sustain", "swallow", "swamp", "swap", "swarm", "swear", "sweet", "swift", "swim", "swing", "switch", "sword", "symbol", "symptom", "syrup", "system", "table", "tackle", "tag", "tail", "talent", "talk", "tank", "tape", "target", "task", "taste", "tattoo", "taxi", "teach", "team", "tell", "ten", "tenant", "tennis", "tent", "term", "test", "text", "thank", "that", "theme", "then", "theory", "there", "they", "thing", "this", "thought", "three", "thrive", "throw", "thumb", "thunder", "ticket", "tide", "tiger", "tilt", "timber", "time", "tiny", "tip", "tired", "tissue", "title", "toast", "tobacco", "today", "toddler", "toe", "together", "toilet", "token", "tomato", "tomorrow", "tone", "tongue", "tonight", "tool", "tooth", "top", "topic", "topple", "torch", "tornado", "tortoise", "toss", "total", "tourist", "toward", "tower", "town", "toy", "track", "trade", "traffic", "tragic", "train", "transfer", "trap", "trash", "travel", "tray", "treat", "tree", "trend", "trial", "tribe", "trick", "trigger", "trim", "trip", "trophy", "trouble", "truck", "true", "truly", "trumpet", "trust", "truth", "try", "tube", "tuition", "tumble", "tuna", "tunnel", "turkey", "turn", "turtle", "twelve", "twenty", "twice", "twin", "twist", "two", "type", "typical", "ugly", "umbrella", "unable", "unaware", "uncle", "uncover", "under", "undo", "unfair", "unfold", "unhappy", "uniform", "unique", "unit", "universe", "unknown", "unlock", "until", "unusual", "unveil", "update", "upgrade", "uphold", "upon", "upper", "upset", "urban", "urge", "usage", "use", "used", "useful", "useless", "usual", "utility", "vacant", "vacuum", "vague", "valid", "valley", "valve", "van", "vanish", "vapor", "various", "vast", "vault", "vehicle", "velvet", "vendor", "venture", "venue", "verb", "verify", "version", "very", "vessel", "veteran", "viable", "vibrant", "vicious", "victory", "video", "view", "village", "vintage", "violin", "virtual", "virus", "visa", "visit", "visual", "vital", "vivid", "vocal", "voice", "void", "volcano", "volume", "vote", "voyage", "wage", "wagon", "wait", "walk", "wall", "walnut", "want", "warfare", "warm", "warrior", "wash", "wasp", "waste", "water", "wave", "way", "wealth", "weapon", "wear", "weasel", "weather", "web", "wedding", "weekend", "weird", "welcome", "west", "wet", "whale", "what", "wheat", "wheel", "when", "where", "whip", "whisper", "wide", "width", "wife", "wild", "will", "win", "window", "wine", "wing", "wink", "winner", "winter", "wire", "wisdom", "wise", "wish", "witness", "wolf", "woman", "wonder", "wood", "wool", "word", "work", "world", "worry", "worth", "wrap", "wreck", "wrestle", "wrist", "write", "wrong", "yard", "year", "yellow", "you", "young", "youth", "zebra", "zero", "zone", "zoo"];

let isCN = process.env.BingAutoSearch_isCN || 0;


console.log("\nBing Auto Search\nVersion " + Version + "\n")


// 创建axios实例
let axios_bing;
if (proxy && isCN == 0) {
    const httpsAgent = new HttpsProxyAgent(proxy);
    axios_bing = axios.create({
        baseURL: 'https://www.bing.com/',
        timeout: 7000,
        headers: {
            "Cookie": Cookie,
            "Accept-Encoding": 'gzip, deflate, br'
        },
        withCredentials: true,
        proxy: false,
        httpsAgent
    });
} else if(!proxy && isCN == 0){
    axios_bing = axios.create({
        baseURL: 'https://www.bing.com/',
        timeout: 7000,
        headers: {
            "Cookie": Cookie,
            "Accept-Encoding": 'gzip, deflate, br'
        },
        withCredentials: true
    });
} else if(proxy && isCN == 1){
    axios_bing = axios.create({
        baseURL: 'https://cn.bing.com/',
        timeout: 7000,
        headers: {
            "Cookie": Cookie,
            "Accept-Encoding": 'gzip, deflate, br'
        },
        withCredentials: true,
        proxy: false,
        httpsAgent
    });
} else if(!proxy && isCN == 1){
    axios_bing = axios.create({
        baseURL: 'https://cn.bing.com/',
        timeout: 7000,
        headers: {
            "Cookie": Cookie,
            "Accept-Encoding": 'gzip, deflate, br'
        },
        withCredentials: true
    });
}


login();


// 判断是否登录 
var username = '';
var flag1 = 1;
var flag2 = 1;
async function login() {
    axios_bing.get('/', {
            headers: {
                "User-Agent": edgeUserAgent,
            }
        })
        .then(function(response) {
            if (response.status == 200) {
                // console.log(response.data);
                // console.log(response.headers['set-cookie']);
                username_temp = /<span id="id_n" title="(.*?)"/.exec(response.data);
                if (username_temp) {
                    username = username_temp[1];
                    console.log('已登录账号: ' + username + '\n');
                    login2();
                } else {
                    login2();
                }
            } else {
                console.log('未知错误');
                // console.log(response.data);
                // process.exit();
            }
        })
        .catch(function(error) {
            catcherror(error);
            if (flag1 < 5) {
                login();
                flag1++;
            } else {
                console.log('\n网络错误\n');
                if (notify) {
                    notify.sendNotify('Bing Auto Search', '网络错误');
                }
                status(-1, '网络错误');
            }
        });
}
async function login2() {
    axios_bing.get('https://rewards.bing.com/', {
            headers: {
                "User-Agent": edgeUserAgent,
            }
        })
        .then(function(response) {
            if (response.status == 200) {
                // console.log(response.data);
                username_temp = /email: "(.*?)"/.exec(response.data);
                if (username_temp) {
                    username = username_temp[1];
                    console.log('已登录账号: ' + username + '\n');
                    getPoints(1);
                } else {
                    console.log('未获取到登录信息\n');
                    getPoints(1);
                }
            } else {
                console.log('未知错误');
                // console.log(response.data);
                // process.exit();
            }
        })
        .catch(function(error) {
            catcherror(error);
            if (flag2 < 5) {
                login2();
                flag2++;
            } else {
                console.log('\n网络错误\n');
                if (notify) {
                    notify.sendNotify('Bing Auto Search', '网络错误');
                }
                status(-1, '网络错误');
            }
        });
}

// 主函数
var flag = 0;
async function main(Terminal, terminal, UserAgent) {
    await sleep(sleep_sec * 1000);

    ret(Terminal, wordlists[Math.floor(Math.random() * wordlists.length)], UserAgent);
    let loop = await getuserinfo(terminal);
    if (!loop & Terminal == 'PC' & flag == 0) {
        await main('Mobile', 'mobile', mobileUserAgent);
    } else if (!loop & Terminal == 'Mobile' & flag == 0) {
        await main('PC', 'pc', edgeUserAgent);
    } else if (loop & Terminal == 'PC' & flag == 0) {
        flag += 1;
        await main('Mobile', 'mobile', mobileUserAgent);
    } else if (loop & Terminal == 'Mobile' & flag == 0) {
        flag += 1;
        await main('PC', 'pc', edgeUserAgent);
    } else if (!loop & Terminal == 'Mobile' & flag == 1) {
        await main('Mobile', 'mobile', mobileUserAgent);
    } else if (!loop & Terminal == 'PC' & flag == 1) {
        await main('PC', 'pc', edgeUserAgent);
    } else {
        getPoints(2);
    }
}

// 获取积分
var Points_temp = 0;
var flag3 = 1;
function getPoints(flag) {
    axios_bing.get('https://rewards.bing.com/api/getuserinfo?type=1', {})
        .then(function(response) {
            if (response.status == 200) {
                let Points = response.data.dashboard.userStatus.availablePoints;
                Points_temp = Points - Points_temp;
                console.log('当前积分：' + Points + '\n');
                if (flag == 1) {
                    console.log('当前Rewards区域: ' + response.data.dashboard.userStatus.counters.pcSearch[0].name.substring(0, 4) + '\n');
                    main('PC', 'pc', edgeUserAgent);
                } else if (flag == 2 & username != '') {
                    if (notify) {
                        notify.sendNotify('Bing Auto Search', username + '\n当前分数：' + Points + ' 新增分数：' + Points_temp);
                    }
                    status(Points, Points_temp);
                } else if (flag == 2) {
                    if (notify) {
                        notify.sendNotify('Bing Auto Search', '当前分数：' + Points + '\n新增分数：' + Points_temp);
                    }
                    status(Points, Points_temp);
                }
            } else {
                console.log('未知错误');
                console.log(response.data);
                // process.exit();
            }
        })
        .catch(function(error) {
            catcherror(error);
            if (flag3 < 7) {
                getPoints(flag);
                flag3++;
            } else if (flag3 < 17 & flag == 2){
                getPoints(flag);
                flag3++;
            } else {
                console.log('\n登录失败，请尝试重新获取cookie\n');
                if (notify) {
                    notify.sendNotify('Bing Auto Search', '登录失败');
                }
                status(-1, '登录失败');
            }
        });
};

// 搜索函数
function ret(Terminal, q, UserAgent) {
    axios_bing.get('/search', {
            params: {
                q: q
            },
            headers: {
                "User-Agent": UserAgent,
            },
        })
        .then(function(response) {
            if (response.status == 200) {
                console.log(Terminal + ' search: ' + q);
            } else {
                console.log('未知错误');
                console.log(response.data);
                // process.exit();
            }
        })
        .catch(function(error) {
            catcherror(error);
        });
};

// 获取进度
function getuserinfo(terminal) {
    return axios_bing.get('https://rewards.bing.com/api/getuserinfo?type=1', {})
        .then(function(response) {
            if (response.status == 200) {
                try {
                    let progress = response.data.dashboard.userStatus.counters[terminal + 'Search'][0].attributes.progress;
                    let max = response.data.dashboard.userStatus.counters[terminal + 'Search'][0].attributes.max;
                    console.log('(' + progress + '/' + max + ')');
                    if (progress == max) {
                        return true;
                    } else {
                        return false;
                    }
                } catch (error) {
                    console.log('不存在 ' + terminal + ' 任务');
                    return true;
                }
            } else {
                console.log('未知错误');
                console.log(response.data);
                // process.exit();
            }
        })
        .catch(function(error) {
            catcherror(error);
        });
};

// 睡眠函数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, Math.random() * ms + ms / 2));
}

// 错误处理
function catcherror(error) {
    if (error.toString().indexOf("AxiosError: timeout") != -1) {
        console.error("AxiosError: timeout");
    } else if (error.toString().indexOf("Error: aborted") != -1) {
        console.error("AxiosError: aborted");
    } else if (error.toString().indexOf("AxiosError: Request failed with status code 503") != -1) {
        console.error("AxiosError: Request failed with status code 503");
    } else if (error.toString().indexOf("AxiosError: Request failed with status code 500") != -1) {
        console.error("AxiosError: Request failed with status code 500");
    } else if (error.toString().indexOf("AxiosError: getaddrinfo EAI_AGAIN") != -1) {
        console.error("AxiosError: getaddrinfo EAI_AGAIN");
    } else if (error.toString().indexOf("AxiosError: maxContentLength size") != -1) {
        console.error("AxiosError: maxContentLength size");
    } else if (error.toString().indexOf("AxiosError: read ECONNRESET") != -1) {
        console.error("AxiosError: read ECONNRESET");
    } else if (error.toString().indexOf("Error: Client network socket disconnected before secure TLS connection was established") != -1) {
        console.error("AxiosError: Client network socket disconnected before secure TLS connection was established");
    } else if (error.toString().indexOf("TypeError [ERR_INVALID_CHAR]: Invalid character in header content [\"Cookie\"]") != -1) {
        console.error("TypeError [ERR_INVALID_CHAR]: Invalid character in header content [\"Cookie\"]");
    } else if (error.toString().indexOf("Error: socket hang up") != -1) {
        console.error("AxiosError: socket hang up");
    } else if (error.toString().indexOf("AxiosError") != -1) {
        console.error('AxiosError');
        // console.error(error);
    } else {
        console.error(error.toString());
    }
}

// 汇总
async function status(Points, Points_temp) {
    if (fs.existsSync('status.txt')) {
        let arr = [];
        let output = '';
        const rl = readline.createInterface({
            input: fs.createReadStream('status.txt'),
            output: process.stdout,
            terminal: false
        });

        rl.on('line', (line) => {
            if (line.indexOf('r_') != -1) {
                arr[/r_([0-9]*)/.exec(line)[1]] = line;
            }
        });

        await events.once(rl, 'close');

        let today = new Date();
        let now = today.toLocaleString('en-US');
        let temp = 'BingAutoSearch_MicroSoft_COOKIE';
        let r = /_[0]*([0-9]+)/.exec(temp)[1];
        let gotcha;
        if (Points >= 9600){
            gotcha = '收菜!';
        } else if (Points > 0 ){
            gotcha = Math.ceil((9600 - Points) / 270) + '天';
        } else if (Points == -1) {
            gotcha = '';
        } else {
            gotcha = '';
        }
        arr[r] = 'r_' + r + '  ' + Points + '  ' + Points_temp + '  ' + now + '  ' + gotcha;

        for (const v of arr) {
            if (v != undefined) {
                output += v + '\n';
                fs.writeFileSync('status.txt', output)
            }
        }
    }
}
