const express = require('express');
const { EdgeTTS, listVoices } = require('edge-tts-universal');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const multer = require('multer');

// 确保目录存在
async function ensureDir(dirPath) {
    if (!fsSync.existsSync(dirPath)) {
        fsSync.mkdirSync(dirPath, { recursive: true });
    }
}

// 使用 edge-tts-universal 将文本转换为语音
async function toVoicePromise(text, filePath, options = {}) {
    const { voice = 'zh-CN-XiaoxiaoNeural', rate, volume, pitch } = options;
    
    // 构建选项对象（edge-tts-universal 使用特殊格式）
    // 只有当参数不为 0 时才传递，避免传递 '0%' 等无效格式
    const ttsOptions = {};
    
    // 处理 rate 参数
    if (rate !== undefined && rate !== null) {
        const numRate = typeof rate === 'number' ? rate : parseFloat(rate);
        if (!isNaN(numRate) && numRate !== 0) {
            ttsOptions.rate = (numRate > 0 ? '+' : '') + numRate + '%';
        }
    }
    
    // 处理 volume 参数
    if (volume !== undefined && volume !== null) {
        const numVolume = typeof volume === 'number' ? volume : parseFloat(volume);
        if (!isNaN(numVolume) && numVolume !== 0) {
            ttsOptions.volume = (numVolume > 0 ? '+' : '') + numVolume + '%';
        }
    }
    
    // 处理 pitch 参数
    if (pitch !== undefined && pitch !== null) {
        const numPitch = typeof pitch === 'number' ? pitch : parseFloat(pitch);
        if (!isNaN(numPitch) && numPitch !== 0) {
            ttsOptions.pitch = (numPitch > 0 ? '+' : '') + numPitch + 'Hz';
        }
    }
    
    console.log('开始生成语音:', { text: text.substring(0, 50) + '...', voice, ...ttsOptions });
    
    // 创建 EdgeTTS 实例
    const tts = new EdgeTTS(text, voice, ttsOptions);
    
    // 生成语音
    const result = await tts.synthesize();
    
    // 获取音频数据
    const audioBuffer = Buffer.from(await result.audio.arrayBuffer());
    
    // 写入文件
    await fs.writeFile(filePath, audioBuffer);
    
    console.log('语音生成成功:', filePath);
    return filePath;
}

// 获取语音列表（从 Microsoft Edge TTS API 动态获取）
async function voicesPromise(lang) {
    try {
        // 从 API 获取所有可用语音
        const allVoices = await listVoices();
        
        // 如果指定了语言代码，进行过滤
        let filteredVoices = allVoices;
        if (lang) {
            const langCode = lang.toLowerCase();
            // 过滤出匹配语言的语音（支持 lang-CN 格式）
            filteredVoices = allVoices.filter(voice => {
                const locale = (voice.Locale || '').toLowerCase();
                const language = (voice.Language || '').toLowerCase();
                return locale.includes(langCode) || language.includes(langCode);
            });
        }
        
        // 返回格式化后的语音列表
        return filteredVoices.map(voice => ({
            name: voice.Name || '',
            shortName: voice.ShortName || '',
            locale: voice.Locale || '',
            language: voice.Language || '',
            gender: voice.Gender || 'Unknown',
            friendlyName: voice.FriendlyName || '',
            displayName: `${voice.FriendlyName || 'Unknown'} (${voice.Gender === 'Female' ? '女' : '男'}) - ${voice.Locale || ''}`
        }));
    } catch (error) {
        console.error('获取语音列表失败，使用默认列表:', error);
        // 如果API调用失败，返回默认的中文语音列表
        return [
            { name: 'zh-CN-XiaoxiaoNeural', displayName: '晓晓（女）', locale: 'zh-CN', gender: 'Female' },
            { name: 'zh-CN-YunxiNeural', displayName: '云希（男）', locale: 'zh-CN', gender: 'Male' },
            { name: 'zh-CN-liaoning-XiaobeiNeural', displayName: '辽宁晓北（女）', locale: 'zh-CN', gender: 'Female' }
        ];
    }
}

const app = express();

// 添加JSON解析中间件
app.use(express.json());

// 配置 multer 用于文件上传
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 限制文件大小为 10MB
});

// 确保 uploads 目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fsSync.existsSync(uploadsDir)) {
    fsSync.mkdirSync(uploadsDir, { recursive: true });
}

// 静态文件服务，用于访问生成的音频文件
app.use('/audio', express.static(path.join(__dirname, 'wav')));

// 提供静态HTML文件
app.use(express.static(__dirname));

// 根路径返回index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API端点：将文本转换为语音
app.post('/api/tts', async (req, res) => {
  try {
    const { text, filename, voice, rate, volume, pitch } = req.body;
    
    if (!text || !filename) {
      return res.status(400).json({ error: 'text 和 filename 是必需的参数' });
    }

    const wavDir = path.resolve('./wav');
    await ensureDir(wavDir);
    
    const filePath = path.resolve('./wav/' + filename);
    
    const options = {};
    if (voice) options.voice = voice;
    if (rate !== undefined) options.rate = rate;
    if (volume !== undefined) options.volume = volume;
    if (pitch !== undefined) options.pitch = pitch;

    await toVoicePromise(text, filePath, options);
    
    res.json({ 
      success: true, 
      message: '语音文件生成成功',
      file: `/audio/${filename}`
    });
  } catch (error) {
    console.error('生成语音时出错:', error);
    res.status(500).json({ error: error.message });
  }
});

// API端点：从txt文件读取文本并转换为语音
app.post('/api/tts-from-file', async (req, res) => {
  try {
    const { txtFilePath, outputFilename, voice, rate, volume, pitch } = req.body;
    
    if (!txtFilePath || !outputFilename) {
      return res.status(400).json({ error: 'txtFilePath 和 outputFilename 是必需的参数' });
    }

    // 读取txt文件内容
    const txtContent = await fs.readFile(txtFilePath, 'utf-8');
    const text = txtContent.trim();
    
    if (!text) {
      return res.status(400).json({ error: 'txt文件为空' });
    }

    const wavDir = path.resolve('./wav');
    await ensureDir(wavDir);
    
    const filePath = path.resolve('./wav/' + outputFilename);
    
    const options = {};
    if (voice) options.voice = voice;
    if (rate !== undefined) options.rate = rate;
    if (volume !== undefined) options.volume = volume;
    if (pitch !== undefined) options.pitch = pitch;

    await toVoicePromise(text, filePath, options);
    
    res.json({ 
      success: true, 
      message: '语音文件生成成功',
      textLength: text.length,
      file: `/audio/${outputFilename}`
    });
  } catch (error) {
    console.error('生成语音时出错:', error);
    res.status(500).json({ error: error.message });
  }
});

// API端点：上传txt文件并转换为语音
app.post('/api/upload-and-tts', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传txt文件' });
    }

    const { voice, rate, volume, pitch } = req.body;
    
    // 读取上传的文件内容
    const txtContent = await fs.readFile(req.file.path, 'utf-8');
    const text = txtContent.trim();
    
    // 删除上传的临时文件
    await fs.unlink(req.file.path);
    
    if (!text) {
      return res.status(400).json({ error: 'txt文件为空或无法读取' });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const filename = `output_${timestamp}.mp3`;

    const wavDir = path.resolve('./wav');
    await ensureDir(wavDir);
    
    const filePath = path.resolve('./wav/' + filename);
    
    const options = {};
    if (voice) options.voice = voice;
    if (rate !== undefined) options.rate = rate;
    if (volume !== undefined) options.volume = volume;
    if (pitch !== undefined) options.pitch = pitch;

    await toVoicePromise(text, filePath, options);
    
    res.json({ 
      success: true, 
      message: '语音文件生成成功',
      textLength: text.length,
      file: `/audio/${filename}`
    });
  } catch (error) {
    console.error('生成语音时出错:', error);
    
    // 清理临时文件
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // 忽略删除错误
      }
    }
    
    res.status(500).json({ error: error.message });
  }
});

// API端点：获取所有语音包列表
app.get('/api/voices', async (req, res) => {
  try {
    const { lang } = req.query;
    const voiceList = await voicesPromise(lang);
    res.json({ voices: voiceList });
  } catch (error) {
    console.error('获取语音列表时出错:', error);
    res.status(500).json({ error: error.message });
  }
});

// 首页
app.get('/', (req, res) => {
  res.json({
    message: 'TTS API 服务器运行中',
    endpoints: {
      'POST /api/tts': '将文本转换为语音',
      'POST /api/tts-from-file': '从txt文件读取文本并转换为语音',
      'GET /api/voices': '获取语音包列表'
    },
    examples: {
      tts: "curl -X POST http://localhost:3000/api/tts -H 'Content-Type: application/json' -d '{\"text\":\"你好世界\",\"filename\":\"test.wav\"}'",
      fromFile: "curl -X POST http://localhost:3000/api/tts-from-file -H 'Content-Type: application/json' -d '{\"txtFilePath\":\"./myfile.txt\",\"outputFilename\":\"output.wav\"}'"
    }
  });
});

// 监听端口
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});