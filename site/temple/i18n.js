// All interface wording, in Vietnamese and English. To add a language, copy the
// `en` block, translate it, and add a button in index.html.
const vi = {
  metaDescription: 'Một không gian trên mạng để dạo chơi và ngồi yên cùng nhau, không cần đăng ký.',
  lookOut: 'Nhìn ra cửa sổ', stepBack: 'Quay vào', takeIncense: 'Lấy nhang', takePaper: 'Lấy giấy tiền',
  offerIncense: 'Thắp nhang', burnPaper: 'Đốt giấy tiền', noIncense: 'Bạn chưa có nhang. Nhang để miễn phí trên bàn ở Nhà khách.', noPaper: 'Bạn chưa có giấy. Giấy để miễn phí trên bàn ở Nhà khách.',
  gotIncense: 'Bạn lấy ba nén nhang.', gotPaper: 'Bạn lấy một xấp giấy.', fullHands: 'Bạn đã cầm đủ rồi.', litIncense: 'Ba nén nhang đang cháy.', burntPaper: 'Giấy đang cháy trong lò.',
  floor0: 'Tháp, tầng 1: Điện Phật', floor1: 'Tầng 2: Phòng kinh', floor2: 'Tầng 3: Phòng chư Phật', floor3: 'Tầng 4: Phòng Pháp luân', floor4: 'Tầng 5: Phòng đèn', floor5: 'Tầng 6: Phòng bảo tháp', floor6: 'Tầng 7: Tầng cao nhất',
  goUp: 'Lên tầng trên', goDown: 'Xuống tầng dưới', read: 'Đọc kinh', readTitle: 'Đọc kinh', readBack: 'Danh sách kinh', chantsHead: 'Kinh và tụng niệm',
  readNote: 'Đây là các bản diễn ý ngắn do trang này viết, không phải bản dịch chính thức. Muốn học kỹ, hãy hỏi một vị thầy.', readBook: 'Mở sách Kinh Phật Căn Bản (PDF, trang ngoài)',
  sceneLabel: 'Khung cảnh 3D của Am Mây. Chạm nền để đi, chạm bồ đoàn để ngồi, kéo để nhìn quanh. Có thể chọn nơi đến bằng nút Đi đến.',
  lede: 'Dạo quanh hồ, ngồi yên một lát, giữa những người cũng đang ngồi yên.',
  introNote: 'Không có điểm số, không cần đăng ký. Chỉ ở vườn thiền mới có thể trò chuyện.',
  enter: 'Vào am', whatIs: 'Am Mây là gì?', about: 'Giới thiệu', leave: 'Ra về', close: 'Đóng',
  noWebgl: 'Thiết bị hoặc trình duyệt này chưa bật được đồ họa 3D (WebGL). Bạn hãy thử Chrome hoặc Safari bản mới.',
  demoNote: 'Bản xem thử: các chú tiểu khác là mô phỏng.',
  sit: 'Ngồi xuống', wishFloat: 'Đèn của bạn đang trôi trên hồ.', wishRefused: 'Lời chúc này chưa gửi được. Không dùng liên kết, số điện thoại hay chuyện tiền bạc.', soundOff: 'Tắt âm thanh', feed: 'Cho cá ăn', palms: 'Chắp tay', bow: 'Lạy', beads: 'Tràng hạt', fish: 'Gõ mõ', stand: 'Đứng dậy', sound: 'Âm thanh', bell: 'Thỉnh chuông',
  chatLabel: 'Trò chuyện ở vườn thiền', chatPlaceholder: 'Nói nhỏ thôi nhé...', chatInputLabel: 'Viết tin nhắn', send: 'Gửi',
  chatNote: 'Chỉ có ở vườn thiền. Tin nhắn không được lưu. Chạm một tin để ẩn người gửi.',
  chooseRoom: 'Chọn phòng', roomIntro: 'Mỗi phòng là một bản riêng của cả ngôi am, để không ai phải chen chúc.', goTo: 'Đi đến',
  soundIntro: 'Chỉ mình bạn nghe thấy.', musicHead: 'Nhạc và tiếng thiên nhiên', sutraHead: 'Kinh',
  weather: 'Thời tiết', weatherIntro: 'Chỉ đổi khung cảnh và âm thanh của riêng bạn.', weatherClear: 'Theo giờ trong ngày', weatherSummer: 'Hè nắng', weatherRain: 'Mưa', weatherSnow: 'Tuyết', weatherWind: 'Gió', volume: 'Âm lượng',
  musicBy: 'Nhạc', off: 'Tắt', soundZen: 'Nhạc thiền', soundTemple: 'Chuông và mõ', soundNature: 'Gió, suối, chim',
  noSutra: 'Chưa có bản tụng kinh. Chúng tôi chỉ phát các bản đã được phép sử dụng.',
  beadHelp: 'Chạm để lần một hạt. Đủ 108 hạt là một vòng.', beadAria: 'Lần một hạt', beadPut: 'Cất tràng hạt',
  aboutTitle: 'Am Mây là gì?',
  about1: 'Am Mây là một không gian thư giãn trên mạng do một đơn vị tư nhân làm ra. Khung cảnh được dựng theo cảm hứng từ kiến trúc chùa, nhưng không mô phỏng một ngôi chùa có thật. Đây không phải là chùa, không thuộc tổ chức tôn giáo nào và không có tăng ni điều hành. Các nhà sư gặp ở đây là nhân vật do máy tính tạo ra.',
  about2: 'Ngồi ở đây không thay thế việc đến chùa, tu học hay nghi lễ thật. Tượng Phật và Quan Âm ở đây là hình ảnh đồ họa, được đặt với lòng kính trọng, không phải là vật thờ. Nhang và giấy ở đây chỉ là hình ảnh miễn phí, không bán gì cả. Những cái lạy, hạt lần, nhang và giấy trên màn hình không tính thành công đức, cũng không đem lại phước hay may mắn.',
  about3: 'Am Mây miễn phí và không nhận tiền. Hòm trong am chỉ nhận lời chúc, không nhận tiền công đức. Am Mây không nhận lời cầu an, cầu siêu. Nếu ai đó xin tiền dưới tên Am Mây, đó không phải là chúng tôi.',
  dataHead: 'Dữ liệu của bạn',
  about4: 'Am Mây không cần tài khoản và không hỏi số điện thoại hay niềm tin của bạn. Tên hiển thị do bạn tự chọn và lựa chọn nhân vật chỉ lưu trên thiết bị này. Tin nhắn bên ngoài các điện chỉ đến những người đang ở đó và không được lưu; xin đừng viết chuyện riêng tư, kể cả niềm tin của bạn. Số lạy và số hạt chỉ ở trên thiết bị của bạn.',
  contactHead: 'Liên hệ', contactLine: 'Góp ý hoặc báo lỗi:',
  wishTitle: 'Gửi một lời chúc cho thế gian', wishButton: 'Gửi lời chúc', wishBox: 'Hòm lời chúc', wishOwn: 'Hoặc tự viết lời của bạn', wishSend: 'Thả đèn',
  wish1: 'Chọn một lời chúc, hoặc tự viết. Lời chúc sẽ thành một chiếc đèn hoa đăng trôi trên hồ cá. Chạm vào đèn để đọc.',
  wish2: 'Lời chúc không kèm tên, nhưng mọi người trong phòng đều đọc được, nên đừng viết điều riêng tư. Không mất phí. Am Mây không cầu nguyện hay làm lễ thay bạn.',
  wishSlow: 'Đèn của bạn vừa được thả. Đợi một lát rồi gửi tiếp nhé.',
  wish_peace: 'Mong thế gian bình an, không còn chiến tranh.', wish_weather: 'Mong mưa thuận gió hòa, mùa màng tươi tốt.', wish_children: 'Mong mọi đứa trẻ được lớn lên khỏe mạnh và được yêu thương.', wish_healing: 'Mong người đang đau ốm sớm bình phục.', wish_kindness: 'Mong chúng ta đối xử với nhau dịu dàng hơn.',
  roomLabel: 'Phòng {room}: {count} người', roomChoice: 'Phòng {id}: {count}/{capacity}', placeLabel: '{place} (đi đến...)',
  hintWalk: 'Chạm nền để đi, chạm bồ đoàn để ngồi, kéo để nhìn quanh', hintWater: 'Chạm mặt nước để cho cá ăn',
  feedCloser: 'Hãy đến gần mặt nước hơn để cho cá ăn.', feedWait: 'Đợi cá ăn hết nắm này đã nhé.',
  seatTaken: 'Tấm bồ đoàn này đã có người ngồi.', greeted: '{name} chắp tay chào', disconnected: 'Mất kết nối. Đang nối lại.',
  full: 'Các phòng đều đã kín chỗ. Đang chờ một chỗ trống, bạn cứ để nguyên trang này.',
  bellTime: 'Tiếng chuông báo giờ. Mời bạn ngồi yên một lát.', rest: 'Bạn đã ngồi khá lâu. Đứng dậy vươn vai, uống ngụm nước nhé.',
  hidden: 'Đã ẩn tin nhắn của người này.', chatSlow: 'Viết chậm lại một chút nhé.', chatLong: 'Tin nhắn dài quá, tối đa 120 ký tự.',
  chatLink: 'Không gửi được đường dẫn ở đây.', chatContact: 'Không gửi số điện thoại hay email ở đây.',
  chatBlocked: 'Tin nhắn này không gửi được. Ở đây không nói chuyện tiền bạc hay lời lẽ nặng nề.', chatRefused: 'Tin nhắn không gửi được.',
};

const en = {
  metaDescription: 'An online space to wander and sit quietly together, with no sign-up.',
  lookOut: 'Look out of the window', stepBack: 'Step back', takeIncense: 'Take incense', takePaper: 'Take votive paper',
  offerIncense: 'Light incense', burnPaper: 'Burn votive paper', noIncense: 'You have no incense yet. It is free on the table in the Guest hall.', noPaper: 'You have no paper yet. It is free on the table in the Guest hall.',
  gotIncense: 'You took three incense sticks.', gotPaper: 'You took a bundle of paper.', fullHands: 'Your hands are full.', litIncense: 'Three incense sticks are burning.', burntPaper: 'The paper is burning in the furnace.',
  floor0: 'Pagoda, level 1: Buddha hall', floor1: 'Level 2: Sutra room', floor2: 'Level 3: Room of many Buddhas', floor3: 'Level 4: Dharma wheel room', floor4: 'Level 5: Room of lamps', floor5: 'Level 6: Stupa room', floor6: 'Level 7: Top room',
  goUp: 'Go upstairs', goDown: 'Go downstairs', read: 'Read a sutra', readTitle: 'Read a sutra', readBack: 'All sutras', chantsHead: 'Sutras and chants',
  readNote: 'These are short plain versions written for this site, not official translations. For deeper study, ask a teacher.', readBook: 'Open the book Kinh Phật Căn Bản (PDF, outside site, in Vietnamese)',
  sceneLabel: '3D view of Am Mây. Tap the ground to walk, tap a cushion to sit, drag to look around. You can also choose a place with the Go to button.',
  lede: 'Walk around the lake and sit for a while, among others sitting quietly too.',
  introNote: 'No scores and no sign-up. You can only chat in the Zen garden.',
  enter: 'Enter', whatIs: 'What is Cloud Temple?', about: 'About', leave: 'Leave', close: 'Close',
  noWebgl: 'This device or browser cannot show 3D graphics (WebGL). Please try a recent version of Chrome or Safari.',
  demoNote: 'Preview: the other novices are simulated.',
  sit: 'Sit down', wishFloat: 'Your lantern is floating on the pond.', wishRefused: 'This wish was not sent. No links, phone numbers or money, please.', soundOff: 'Sound off', feed: 'Feed koi', palms: 'Palms together', bow: 'Bow', beads: 'Beads', fish: 'Wooden fish', stand: 'Stand up', sound: 'Sound', bell: 'Ring bell',
  chatLabel: 'Zen garden chat', chatPlaceholder: 'Speak softly...', chatInputLabel: 'Write a message', send: 'Send',
  chatNote: 'Only in the Zen garden. Messages are not saved. Tap a message to hide its sender.',
  chooseRoom: 'Choose a room', roomIntro: 'Each room is a separate copy of the whole site, so nobody has to crowd in.', goTo: 'Go to',
  soundIntro: 'Only you can hear this.', musicHead: 'Music and nature', sutraHead: 'Sutras',
  weather: 'Weather', weatherIntro: 'This only changes your own view and sound.', weatherClear: 'Follow the time of day', weatherSummer: 'Hot summer', weatherRain: 'Rain', weatherSnow: 'Snow', weatherWind: 'Wind', volume: 'Volume',
  musicBy: 'Music', off: 'Off', soundZen: 'Zen music', soundTemple: 'Bell and wooden fish', soundNature: 'Wind, stream, birds',
  noSutra: 'No sutra recordings yet. We only play recordings we have permission to use.',
  beadHelp: 'Tap to move one bead. 108 beads make one round.', beadAria: 'Move one bead', beadPut: 'Put the beads away',
  aboutTitle: 'What is Cloud Temple?',
  about1: 'Cloud Temple is an online relaxation space made by a private operator. Its scenery is inspired by pagoda architecture but does not copy any real pagoda. Despite the name, it is not a real temple, does not belong to any religious organisation, and is not run by monks or nuns. The monks you meet here are computer characters.',
  about2: 'Sitting here does not replace visiting a temple, study or real ceremonies. The statues of the Buddha and Quan Âm are graphic images placed with respect, not objects of worship. Bows, beads, incense and paper on a screen earn no merit and bring no blessing or luck. The incense and paper are free pictures and nothing is sold.',
  about3: 'Cloud Temple is free and takes no money. The boxes here hold wishes only, not temple offerings. Cloud Temple takes no prayer requests. If anyone asks for money in Cloud Temple\'s name, it is not us.',
  dataHead: 'Your data',
  about4: 'Cloud Temple needs no account and does not ask for your phone number or beliefs. You choose the name others see, and your character choices stay on this device. Messages outside the halls go live only to people there and are not saved; please do not write personal details, including your beliefs. Your bow and bead counts stay on your device.',
  contactHead: 'Contact', contactLine: 'Feedback or problems:',
  wishTitle: 'Send a wish to the world', wishButton: 'Send a wish', wishBox: 'Wish box', wishOwn: 'Or write your own', wishSend: 'Float lantern',
  wish1: 'Choose a wish or write your own. It becomes a paper lotus lantern floating on the koi pond. Tap a lantern to read it.',
  wish2: 'Wishes carry no name, but everyone in the room can read them, so keep private things out. It costs nothing. Cloud Temple does not pray or hold ceremonies on your behalf.',
  wishSlow: 'Your lantern has just been floated. Wait a moment before sending another.',
  wish_peace: 'May the world be at peace, with no more war.', wish_weather: 'May the rains come gently and the harvests be good.', wish_children: 'May every child grow up healthy and loved.', wish_healing: 'May those who are ill recover soon.', wish_kindness: 'May we be gentler with one another.',
  roomLabel: 'Room {room}: {count} here', roomChoice: 'Room {id}: {count}/{capacity}', placeLabel: '{place} (go to...)',
  hintWalk: 'Tap the ground to walk, tap a cushion to sit, drag to look around', hintWater: 'Tap the water to feed the koi',
  feedCloser: 'Move closer to the water to feed the koi.', feedWait: 'Let the koi finish this handful first.',
  seatTaken: 'Someone is already on that cushion.', greeted: '{name} greets you with palms together', disconnected: 'Connection lost. Reconnecting.',
  full: 'All rooms are full. Waiting for a free place; please keep this page open.',
  bellTime: 'The bell marks the hour. Please sit quietly for a moment.', rest: 'You have been sitting a while. Stand, stretch and have some water.',
  hidden: 'Messages from this person are now hidden.', chatSlow: 'Please write a little more slowly.', chatLong: 'That message is too long; the limit is 120 characters.',
  chatLink: 'Links cannot be sent here.', chatContact: 'Phone numbers and emails cannot be sent here.',
  chatBlocked: 'This message cannot be sent. Please avoid money talk and harsh language here.', chatRefused: 'The message could not be sent.',
};

const PLACE_EN = {
  avenue: 'Entrance avenue', outer: 'Great gate', garden: 'Zen garden', tamquan: 'Tam quan gate', south: 'South bank', 'bridge-s': 'Stone bridge',
  island: 'Lake tower', main: 'Main hall', lecture: 'Lecture hall', zen: 'Meditation hall', guest: 'Guest hall', tea: 'Tea house', bell: 'Bell tower',
  deck: 'Garden terrace', west: 'West bank', east: 'East bank', north: 'North bank', 'bridge-n': 'North bridge', passage: 'Back path', 'pav-w': 'West pavilion', 'pav-e': 'East pavilion', 'steps-s': 'Steps', 'steps-n': 'Steps',
};
const NAME_EN = {
  Mây: 'Cloud', Trăng: 'Moon', Gió: 'Breeze', Sương: 'Mist', Lá: 'Leaf', Suối: 'Stream', Sen: 'Lotus', Nắng: 'Sunlight', Rêu: 'Moss', Tre: 'Bamboo', Sóng: 'Wave', Khói: 'Smoke',
  'Thong Thả': 'Unhurried', 'Dịu Dàng': 'Gentle', 'Lặng Yên': 'Still', 'Nhẹ Nhàng': 'Soft', 'Hiền Hòa': 'Kind', 'An Nhiên': 'Serene', 'Chậm Rãi': 'Slow', 'Trong Veo': 'Clear', 'Mềm Mại': 'Tender', 'Thảnh Thơi': 'Restful',
};

const DICT = { vi, en };
function initial() {
  try {
    const saved = localStorage.getItem('amMay.lang');
    if (DICT[saved]) return saved;
  } catch { /* Storage can be blocked. */ }
  const forced = new URLSearchParams(location.search).get('lang');
  if (DICT[forced]) return forced;
  return (navigator.language || 'vi').toLowerCase().startsWith('vi') ? 'vi' : 'en';
}

export const i18n = {
  lang: initial(),
  listeners: [],
  set(lang) {
    if (!DICT[lang]) return;
    this.lang = lang;
    try { localStorage.setItem('amMay.lang', lang); } catch { /* See above. */ }
    this.apply();
    this.listeners.forEach((fn) => fn());
  },
  apply() {
    document.documentElement.lang = this.lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('metaDescription'));
    document.querySelectorAll('[data-lang]').forEach((el) => el.setAttribute('aria-pressed', String(el.dataset.lang === this.lang)));
  },
};

export function t(key, vars = {}) {
  const text = DICT[i18n.lang][key] ?? vi[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
export const placeName = (place) => (i18n.lang === 'en' ? PLACE_EN[place.id] || place.nameEn || place.name : place.name);

// Names arrive from the server in Vietnamese: "Mây Thong Thả" becomes "Unhurried Cloud".
export function visitorName(name) {
  if (i18n.lang !== 'en' || !name) return name;
  const [first, ...rest] = name.split(' ');
  const a = NAME_EN[first];
  const b = NAME_EN[rest.join(' ')];
  return a && b ? `${b} ${a}` : name;
}
