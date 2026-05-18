<template>
  <main class="brand-board-page">
    <button class="back-button" type="button" @click="router.push('/')">
      返回首页
    </button>
    <h1>品 牌 战 略 看 板</h1>

    <section class="board-grid">
      <article
        v-for="card in strategyCards"
        :key="card.title"
        class="strategy-card"
        :class="[`tone-${card.tone}`]"
      >
        <span class="more-dot">...</span>
        <h2>{{ card.title }}</h2>
        <div class="stars" aria-hidden="true">
          <span v-for="index in 7" :key="index">★</span>
        </div>
        <p v-for="line in card.lines" :key="line">{{ line }}</p>
      </article>
    </section>

    <section class="doc-grid">
      <button v-for="doc in docs" :key="doc" class="doc-card" type="button">
        <span class="doc-more">...</span>
        <el-icon><Document /></el-icon>
        《{{ doc }}》
      </button>
    </section>
  </main>
</template>

<script setup lang="ts">
import { Document } from "@element-plus/icons-vue";

const router = useRouter();

const strategyCards = [
  {
    title: "愿 景",
    tone: "red",
    lines: ["每个身负使命的人", "都能在浩瀚星河中找到", "属于自己的坐标与家园"],
  },
  {
    title: "客户选择",
    tone: "green",
    lines: ["那些在使命路上", "孤独前行、身负压力", "却仰望星空的人"],
  },
  {
    title: "核心优势",
    tone: "orange",
    lines: [
      "我们手握星辰的古天文体系、著",
      "书立说的理论深度，以及“天文",
      "手串”开创者的先发身位",
    ],
  },
  {
    title: "产品组合",
    tone: "purple",
    lines: [
      "手串是入门的星钥，课程与白酒是交",
      "心的酒食，观星与中医是沉浸的道",
      "场，文创与AR是未来的星图",
    ],
  },
  {
    title: "品牌承诺",
    tone: "blue",
    lines: ["“穿越光年，自为守护”", "你负责使命，我们负责星河。"],
  },
  { title: "使 命", tone: "red", lines: ["每个人皆星辰下凡", "生而带使命"] },
  {
    title: "价值主张",
    tone: "green",
    lines: ["有星可以", "有伴可依", "有礼可循"],
  },
  {
    title: "护城河",
    tone: "orange",
    lines: [
      "吉星理论是墙，社群归属是",
      "河，六步仪式是桥——外人难",
      "仿，内容深依",
    ],
  },
  {
    title: "增长策略",
    tone: "purple",
    lines: ["以公域内容点燃星火", "以私域社群淬炼星链", "以海外弟子织就星网"],
  },
  {
    title: "体验设计",
    tone: "blue",
    lines: [
      "从初次佩戴的仪式震颤，到社群认",
      "同的心跳共振，再到即时晋升的",
      "泪光闪烁——每一步都是星轨",
    ],
  },
  {
    title: "核心价值观",
    tone: "red",
    lines: ["守护者", "引路人", "共同体构建者"],
  },
  {
    title: "竞争差异",
    tone: "green",
    lines: ["一整套从星宿理论", "到佩戴仪式", "再到即时共浴的星学生态"],
  },
  {
    title: "品牌新人表述",
    tone: "orange",
    lines: [
      "古天文专家的背书、媒体的见",
      "证、用户的康复故事，以及每",
      "一位志工的信用",
    ],
  },
  {
    title: "支撑体系",
    tone: "purple",
    lines: ["AI为线，职阶为结，资本为梭", "织出自我强化的共生星空"],
  },
  {
    title: "品牌表达",
    tone: "blue",
    lines: [
      "“让星河守护每一个有使命的人”",
      "深蓝、金、白，繁体与星徽",
      "是我们与宇宙对话的语言",
    ],
  },
];

const docs = [
  "北斗宣言",
  "战略定位与品牌承诺图",
  "优势、壁垒与信任状体系",
  "商业模式与体验交付全景图",
  "品牌引力场与体验蓝图",
];
</script>

<style scoped lang="scss">
.brand-board-page {
  position: relative;
  min-height: 100vh;
  padding: 22px 32px 38px;
  background: #ffffff;
}

.back-button {
  position: absolute;
  top: 22px;
  left: 32px;
  height: 32px;
  padding: 0 16px;
  color: #1267ff;
  background: #eef5ff;
  border: 1px solid #c8ddff;
  border-radius: 999px;
}

h1 {
  margin: 0 0 28px;
  color: #333333;
  font-size: 27px;
  font-weight: 800;
  letter-spacing: 12px;
  text-align: center;
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(180px, 1fr));
  gap: 20px 30px;
}

.strategy-card {
  position: relative;
  min-height: 136px;
  padding: 17px 18px 15px;
  text-align: center;
  background: #ffffff;
  border: 2px solid #edf0f4;
  border-radius: 13px;
  box-shadow: 0 2px 10px rgb(32 45 66 / 10%);

  &:hover {
    border: 2px solid #2e72ff;
    box-shadow: 0 2px 12px rgb(46 114 255 / 18%);
  }

  h2 {
    margin: 0 0 5px;
    color: #333333;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 3px;
  }

  p {
    margin: 0 0 4px;
    color: #767676;
    font-size: 12px;
    line-height: 1.55;
  }
}

.more-dot {
  position: absolute;
  top: 6px;
  left: 50%;
  color: #bcc2cc;
  font-size: 12px;
  transform: translateX(-50%);
}

.stars {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 11px;
}

.tone-red .stars {
  color: #ff424b;
}

.tone-green .stars {
  color: #4ccc2b;
}

.tone-orange .stars {
  color: #ff9d22;
}

.tone-purple .stars {
  color: #ca52ff;
}

.tone-blue .stars {
  color: #1267ff;
}

.doc-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(180px, 1fr));
  gap: 30px;
  margin-top: 20px;
}

.doc-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  gap: 6px;
  color: #1f2733;
  font-size: 14px;
  background: #ffffff;
  border: 1px solid #dfe4eb;
  border-radius: 12px;

  .el-icon {
    color: #1267ff;
  }
}

.doc-more {
  position: absolute;
  top: 4px;
  left: 50%;
  color: #b9c0ca;
  font-size: 12px;
  transform: translateX(-50%);
}
</style>
