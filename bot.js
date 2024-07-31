import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';


const apiUrl = 'https://66aa8d5a636a4840d7c7fc27.mockapi.io/points';


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Необходим для получения содержимого сообщенийб
    GatewayIntentBits.GuildVoiceStates, // Необходим для отслеживания состояния голосовых каналов
  ],
});

const checkVoiceChannels = async () => {
  const guilds = client.guilds.cache;

  guilds.forEach(guild => {
    // Получение всех голосовых каналов
    const voiceChannels = guild.channels.cache.filter(c => c.type === 'GUILD_VOICE');

    voiceChannels.forEach(async channel => {
      // Получение всех участников голосового канала
      const members = channel.members;

      members.forEach(member => {
        if (!member.user.bot) {
          if (!member.intervalId) {
            console.log(`Starting points for user ${member.id}`);
            member.intervalId = startPointSystem(member.id);
          } else {
            console.log(`User ${member.id} already has an interval.`);
          }
        }
      });
    });
  });
};

client.once('ready', () => console.log('Ready!'));

const userPoints = new Map(); // Хранение баллов пользователей

const startPointSystem = (userId) => {
  return setInterval(async () => {
    let points = userPoints.get(userId) || 0;
    points += 10;
    userPoints.set(userId, points);

    try {
      // Получение всех пользователей
      const response = await axios.get(apiUrl);
      const users = response.data;

      // Проверка существования пользователя
      const user = users.find(u => u.id === userId);

      if (user) {
        // Обновление существующего объекта
        await axios.put(`${apiUrl}/${user.id}`, { point: points });
      } else {
        // Создание нового объекта
        await axios.post(apiUrl, { id: userId, point: points });
      }
    } catch (error) {
      console.error(`Error saving points for user ${userId}:`, error);
    }
  }, 10000); // Обновление каждые 10 секунд
};

// Остановка начисления баллов
const stopPointSystem = (intervalId) => {
  clearInterval(intervalId);
};


const loadUserPoints = async () => {
  try {
    const response = await axios.get(apiUrl);
    response.data.forEach((user) => {
      userPoints.set(user.id, user.point);
    });
  } catch (error) {
    console.error('Error loading user points:', error);
  }
};

client.on('ready', async () => {
  await loadUserPoints();
  checkVoiceChannels();
});


// Обработка события входа пользователя в голосовой канал
client.on('voiceStateUpdate', (oldState, newState) => {
  if (!oldState.channel && newState.channel) {
    // Пользователь вошел в голосовой канал
    newState.channel.members.forEach(member => {
      if (!member.user.bot) {
        member.intervalId = startPointSystem(member.id);
      }
    });
  }

  if (oldState.channel && !newState.channel) {
    // Пользователь вышел из голосового канала
    oldState.channel.members.forEach(member => {
      if (member.intervalId) {
        stopPointSystem(member.intervalId);
        delete member.intervalId;
      }
    });
  }
  
});

client.on('messageCreate', (message) => {
  if (message.content.includes('Влад')) {
    return message.reply('Ну ВЛАД И ЧЕ');
  }

  if (message.content === '!help') {
    return message.reply("there's no help lmao");
  }

  if (message.content === '!бабло') {
    const points = userPoints.get(message.author.id) || 0;
    const userInfo = `Ваши баллы: ${points}\nПользователь: ${message.author.username}#${message.author.id}`;
    return message.reply(userInfo);
  }
});

client.login('MTI2ODI1OTk0MDc5MTc1MDgyOA.GSiktN.CJQolImEQDF75VCibJCL9B25gKUunLxSAYUPZ0');