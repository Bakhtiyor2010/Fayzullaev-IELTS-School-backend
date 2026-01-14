require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const User = require("./models/User");
const Group = require("./models/Group");

// Botni polling mode bilan ishga tushiramiz
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// User state saqlash uchun
const userStates = {};

// /start komandasi
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = { step: "ask_name" };

  try {
    await bot.sendMessage(
      chatId,
      "Salom! Fayzullaev IELTS School botiga xush kelibsiz!\n" +
      "Ma’lumotlaringizni o'zgartirmoqchi bo'lsangiz /update, botni tark etmoqchi bo'lsangiz /delete ni bosing."
    );
    await bot.sendMessage(chatId, "Iltimos, ismingizni kiriting:");
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

// /update komandasi
bot.onText(/\/update/, async (msg) => {
  const chatId = msg.chat.id;
  delete userStates[chatId];

  try {
    const existingUser = await User.findOne({ telegramId: chatId });
    if (!existingUser) {
      bot.sendMessage(chatId, "Siz hali ro‘yxatdan o‘tmagansiz. /start ni bosing.");
      return;
    }

    userStates[chatId] = { step: "update_name" };
    await bot.sendMessage(chatId, "Iltimos, yangi ismingizni kiriting:");
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

// /delete komandasi
bot.onText(/\/delete/, async (msg) => {
  const chatId = msg.chat.id;
  delete userStates[chatId];

  try {
    const user = await User.findOneAndDelete({ telegramId: chatId });
    if (user) {
      bot.sendMessage(chatId, "Sizning ma’lumotlaringiz o‘chirildi. /start bilan qayta ro‘yxatdan o‘ting.");
    } else {
      bot.sendMessage(chatId, "Siz hali ro‘yxatdan o‘tmagansiz.");
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

// Har qanday matnli xabarni qabul qilish
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  const state = userStates[chatId];
  if (!state) return; // Agar state bo'lmasa, xabarni e’tiborsiz qoldiramiz

  try {
    // --- Ro‘yxatdan o‘tish ---
    if (state.step === "ask_name") {
      state.name = text;
      state.step = "ask_surname";
      await bot.sendMessage(chatId, "Familiyangizni kiriting:");
    } else if (state.step === "ask_surname") {
      state.surname = text;
      state.step = "ask_phone";
      await bot.sendMessage(chatId, "Telefon raqamingizni kiriting (masalan +998901234567 yoki 901234567):");
    } else if (state.step === "ask_phone") {
      state.phone = text;

      // MongoDB dan barcha guruhlarni olish
      const groups = await Group.find();
      if (groups.length === 0) {
        await bot.sendMessage(chatId, "Hozircha guruhlar mavjud emas. Admin bilan bog'laning.");
        delete userStates[chatId];
        return;
      }

      // Inline button shaklida yuborish
      const buttons = groups.map(g => [{ text: g.name, callback_data: g._id }]);
      await bot.sendMessage(chatId, "Iltimos, guruhingizni tanlang:", {
        reply_markup: { inline_keyboard: buttons }
      });

      state.step = "ask_group"; // yangi bosqich
    }

    // --- Update step ---
    else if (state.step === "update_name") {
      state.name = text;
      state.step = "update_surname";
      await bot.sendMessage(chatId, "Familiyangizni kiriting:");
    } else if (state.step === "update_surname") {
      state.surname = text;
      state.step = "update_phone";
      await bot.sendMessage(chatId, "Telefon raqamingizni kiriting (masalan +998901234567):");
    } else if (state.step === "update_phone") {
      state.phone = text;

      // Guruh tanlashni boshlash
      const groups = await Group.find();
      if (groups.length === 0) {
        await bot.sendMessage(chatId, "Hozircha guruhlar mavjud emas. Admin bilan bog'laning.");
        delete userStates[chatId];
        return;
      }
      const buttons = groups.map(g => [{ text: g.name, callback_data: g._id }]);
      await bot.sendMessage(chatId, "Iltimos, yangi guruhingizni tanlang:", {
        reply_markup: { inline_keyboard: buttons }
      });

      state.step = "update_group"; // yangi bosqich
    }

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

// --- Callback query (button bosilganda ishlaydi) ---
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const state = userStates[chatId];
  if (!state) return;

  try {
    if (state.step === "ask_group") {
      const groupId = query.data;
      state.groupId = groupId;

      const newUser = new User({
        telegramId: chatId,
        name: state.name,
        surname: state.surname,
        phone: state.phone,
        groupId: state.groupId
      });
      await newUser.save();

      const groupName = await Group.findById(groupId).then(g => g.name);
      await bot.sendMessage(chatId, `Rahmat, ${state.name} ${state.surname}! Siz ${groupName} guruhiga qo‘shildingiz.`);
      delete userStates[chatId];

    } else if (state.step === "update_group") {
      const groupId = query.data;
      state.groupId = groupId;

      await User.findOneAndUpdate(
        { telegramId: chatId },
        { name: state.name, surname: state.surname, phone: state.phone, groupId: groupId },
        { new: true }
      );

      const groupName = await Group.findById(groupId).then(g => g.name);
      await bot.sendMessage(chatId, `Sizning ma’lumotlaringiz yangilandi va guruhingiz ${groupName} bo‘ldi.`);
      delete userStates[chatId];
    }

    // Telegram query ni acknowledge qilish
    await bot.answerCallbackQuery(query.id);

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

module.exports = bot;
