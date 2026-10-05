/**
 * One-shot patch: insert the 8 onboarding keys that exist in en/fr
 * (selectTranslationHint, versionType, versionTypeClassical/Modern/Revised,
 * remoteVersion, byLanguageSubtitle, langVersionsCount) into every other
 * locale file that lacks them, each with a translation.
 *
 * Run: node scripts/i18n/patch-onboarding-keys.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const LOCALES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'i18n', 'locales');

const TR = {
  es: ['Elija el tipo de versión y luego la traducción','Tipo de versión','Clásica','Moderna','Revisada','Descarga requerida','en {{language}}','{{count}} versión(es)'],
  ar: ['اختر نوع الإصدار ثم الترجمة','نوع الإصدار','كلاسيكية','حديثة','مراجعة','يتطلب تنزيل','باللغة {{language}}','{{count}} إصدار'],
  pt: ['Escolha o tipo de versão e depois a tradução','Tipo de versão','Clássica','Moderna','Revisada','Download necessário','em {{language}}','{{count}} versão(ões)'],
  sw: ['Chagua aina ya toleo kisha tafsiri','Aina ya toleo','Kisasa','Mpya','Imeandikwa upya','Inahitaji kupakua','kwa {{language}}','{{count}} toleo'],
  am: ['የትርጉም ዓይነት ይምረጡ ከዚያም ትርጉም','የትርጉም ዓይነት','ባህላዊ','ዘመናዊ','ተዳጎሟ','የሚፈልግ መሳፈርት','በ{{language}}','{{count}} ስሌታ'],
  bn: ['সংস্করণের ধরন নিন্মাংকরন তারপর অনূবাদের অনুবাদ','সংস্করণের ধরন','পারম্পরিক','আধুনিক','পুনররূপ','ডাউনলোড প্রয়োজন','{{language}}-এ','{{count}} সংস্করণ'],
  dz: ['གཞུང་གི་བསྐྱར་བཀོད་ཀྱི་རྣམ་གཞག་མདའ་ཅིག་བདམས','བསྐྱར་བཀོད་ཀྱི་རྣམ་གཞག','གནས་སྐབས','ཆར་སྣང','བསྐྱར་བཀོད','དབུལ་ཡོད','{{language}}-དུ','{{count}} ལག་ཁང'],
  de: ['Wählen Sie den Typ der Version und dann die Übersetzung','Versionstyp','Klassisch','Modern','Überarbeitet','Download erforderlich','auf {{language}}','{{count}} Version(en)'],
  fa: ['نوع ترجمه را انتخاب کنید و سپس ترجمه','نوع ترجمه','کلاسیک','مدرن','بازبینی','نیاز به دانلود','در {{language}}','{{count}} ترجمه'],
  fil: ['Piliin ang uri ng bersyon at ang salin','Uri ng bersyon','Klasiko','Modernong','Muling binago','Kailangan ng download','sa {{language}}','{{count}} bersyon'],
  ha: ['Zaɓi nau\'nin fassara sannan fassara','Nau\'nin fassara','Da dāwa','Yanzu','An sake duba','Ana buƙatar sauke','a cikin {{language}}','{{count}} fassara'],
  he: ['בחר סוג תרגום ואז תרגום','סוג תרגום','קלאסי','מודרני','מהודר','נדרש הורדה','ב-{{language}}','{{count}} גרסאות'],
  hi: ['संस्करण के प्रकार का चयन करें और फिर अनुवाद','संस्करण प्रकार','शासत्रीय','आधुनिक','संशोधित','डाउनलोड आवश्यक','{{language}} में','{{count}} संस्करण'],
  id: ['Pilih jenis versi lalu terjemahannya','Jenis versi','Klasik','Modern','Diperbarui','Perlu diunduh','dalam {{language}}','{{count}} versi'],
  ig: ['Họrọ ụdị nchịgharị ma jiri ya tụkwasị','Ụdị nchịgharị','Omenala','Mba ncheta','A na-ahazi','Achọrọ ịwụọda','na {{language}}','{{count}} nchịgharị'],
  it: ['Scegli il tipo di versione e poi la traduzione','Tipo di versione','Classica','Moderna','Riveduta','Download necessario','in {{language}}','{{count}} versioni'],
  ja: ['バージョンのタイプを選択してから訳文','バージョンタイプ','古典的','モダン','改訂','ダウンロード必要','{{language}}','{{count}} バージョン'],
  km: ['ជ្រើសរើសប្រភេទវេរ្យុន ហើយភាសាបកប្រែ','ប្រភេទវេរ្យុន','បុរាណ','ទំនើប','កែប្រែ','ត្រូវការទាញយក','ក្នុង {{language}}','{{count}} វេរ្យុន'],
  ko: ['번역 계열을 선택한 후 교리를 선택','번역 계열','고전','현대','개정','다운로드 필요','{{language}}','{{count}} 계열'],
  ku: ['Jêr navê guherîna zimanê û dûv re weşanê','Cûreya guherînê','Klasîk','Modern','Nûve','Daxezkirin hewce ye','bi {{language}}','{{count}} guherîn'],
  lo: ['ເລືອກຊະນຸພາກແບບ ແລ້ວຮູບແບບ','ຊະນຸພາກແບບ','ບຸກບານ','ໂມເດີນ','ໄດ້ນຳມາປັບ','ຕ້ອງໄດ້ດາວໂຫລດ','ໃນພາສາ{{language}}','{{count}} ແບບ'],
  ml: ['വിതാപതതിന്റെ തരം തിരഞ്ഞെടുക്കുക പിന്നെ വിവരണം','വിതാപ തരം','പ്രാചീന','പൂർണ','പരിഷ്കരിച്ചത്','ഡൗൺലോഡ് ആവശ്യം','{{language}}-ൽ','{{count}} വിതാപങ്ങൾ'],
  ms: ['Pilih jenis terjemahan dan kemudian terjemahan','Jenis terjemahan','Klasik','Moden','Diperbaharui','Perlu muat turun','dalam {{language}}','{{count}} versi'],
  my: ['ဗားရှင်းအမျိုးအစားရွေးပြီး ဘာသာပြန်','ဗားရှင်းအမျိုးအစား','ရိုးရာ','ခေတ်မန်','ပြန်လည်တည်းသပ်','ဒေါင်လုဒ်လိုအပ်','{{language}} တွင်','{{count}} ဗားရှင်း'],
  ne: ['संस्करण प्रकार छान्नुहोस् र अनुवाद','संस्करण प्रकार','परम्परागत','आधुनिक','संशोधित','डाउनलोड आवश्यक','{{language}} मा','{{count}} संस्करण'],
  nl: ['Kies het type van de vertaling en dan de vertaling','Vertalingstype','Klassiek','Modern','Revisie','Download vereist','in {{language}}','{{count}} versies'],
  pl: ['Wybierz typ przekładu, a następnie przekład','Typ przekładu','Klasyczny','Współczesny','Rewidowany','Wymaga pobrania','w języku {{language}}','{{count}} przekład(ów)'],
  ps: ['خپل څپرګې ډول او باندان د ښه کولو پیل','ډول','ټول','نوی','ټاکل','ډاونلود','په {{language}}','{{count}} څپرګې'],
  ru: ['Выберите тип перевода, а затем перевод','Тип перевода','Классический','Современный','Редактированный','Требуется загрузка','на {{language}}','{{count}} перевод(ов)'],
  sd: ['سڏ ٻارڙي ۽ پوءِ ڪتب','ڪتب قسم','پرڻ','ٺاڪي','ريو','ڊائونلوڊ گهربل','{{language}} ۾','{{count}} ڪتب'],
  si: ['පරිවර්ගනයේ වර්ගය තෝරාගන්න','පරිවර්ගන වර්ගය','පුරාණ','නවීන','නැවත වෙන් කළ','බාගත අවශ්‍යයි','{{language}}-න්','{{count}} පරිවර්ගන'],
  so: ['Dooro nooca tirsinta, ka dib tirsada','Nooca tirsinta','Cusub','Casri ah','La wareejiyey','Laa\'aanta loo baahan','{{language}}','{{count}} tirsi'],
  st: ['Kgetha mofuta oa phetolelo, ebe o kgetha','Tšepiso','Klasiki','Modern','E ntšitswe','Ho hlokahala ho jarolla','ka {{language}}','{{count}} phetolelo'],
  ta: ['மொழி மாறணத்தின் வகையிற் தேர்ந்தெடுக்கவும்','மொழி மாறண வகை','பாரம்பரிய','நவீன','திருத்தப்பட்டது','பதிவூட்டம் தேவை','{{language}}-ல்','{{count}} மொழி மாறணம்'],
  te: ['పరవర్తన రకాన్ని ఎంచుకోండి','పరవర్తన రకం','పరాచీన','ఆధునిక','సవరించిన','డౌన్‌లౌడ్ అవసరం','{{language}}-లో','{{count}} పరవర్తనలు'],
  th: ['เลือกประเภทการแปล','ประเภทการแปล','คลาสสิก','โมเดิร์น','แก้ไขแล้ว','ต้องดาวน์โหลด','ในภาษา{{language}}','{{count}} ประเภทการแปล'],
  tr: ['Çeviri türünü ve çeviriyi seçin','Çeviri türü','Klasik','Modern','Gözden geçirilmiş','İndirme gerekli','{{language}}','{{count}} çeviri'],
  tw: ['Khethekha kufanekishwa kwe-translation','Kufanekishwa','Klasiki','Kilijuliki','Kifanyilia','Huchakuliwa','katika {{language}}','{{count}} mabadiliko'],
  vi: ['Chọn kiểu phiên bản, sau đó chọn bản dịch','Kiểu phiên bản','Kinh điển','Hiện đại','Đã hiệu đính','Cần tải','trong {{language}}','{{count}} bản dịch'],
  yo: ['Yan bo iṣeto atakora, lẹhin naa yan ife','Awọn ọna','Klasiki','Moderni','Ti a ti ṣe alaye','O nilo siwaju','ni {{language}}','{{count}} iṣeto'],
  zh: ['选择翻译风格，再选择译本','翻译风格','古典','现代','修订','需要下载','{{language}}','{{count}} 版本'],
  'zh-Hant': ['選擇翻譯風格，再選擇譯本','翻譯風格','古典','現代','修訂','需要下載','{{language}}','{{count}} 版本'],
};

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

let patched = 0, skipped = 0;
for (const [lang, trans] of Object.entries(TR)) {
  const file = join(LOCALES_DIR, `${lang}.ts`);
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    console.log(`SKIP ${lang} (no file)`);
    skipped++;
    continue;
  }
  // Guard: only patch if the key is actually absent.
  if (content.includes('versionTypeClassical')) {
    console.log(`SKIP ${lang} (already complete)`);
    skipped++;
    continue;
  }
  const anchor = "selectTranslation: ";
  const idx = content.indexOf(anchor);
  if (idx === -1) {
    console.log(`SKIP ${lang} (anchor not found)`);
    skipped++;
    continue;
  }
  const lineEnd = content.indexOf('\n', idx);
  const lines = [
    `    selectTranslationHint: '${esc(trans[0])}',`,
    `    versionType: '${esc(trans[1])}',`,
    `    versionTypeClassical: '${esc(trans[2])}',`,
    `    versionTypeModern: '${esc(trans[3])}',`,
    `    versionTypeRevised: '${esc(trans[4])}',`,
    `    remoteVersion: '${esc(trans[5])}',`,
    `    byLanguageSubtitle: '${esc(trans[6])}',`,
    `    langVersionsCount: '${esc(trans[7])}',`,
  ];
  content = content.slice(0, lineEnd) + '\n' + lines.join('\n') + content.slice(lineEnd);
  writeFileSync(file, content);
  patched++;
  console.log(`PATCHED ${lang}`);
}
console.log(`\nDone — ${patched} patched, ${skipped} skipped.`);
