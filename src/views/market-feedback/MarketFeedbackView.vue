<template>
  <main class="feedback-page">
    <button class="back-button" type="button" @click="router.push('/')">
      返回首页
    </button>

    <section class="toolbar">
      <span class="toolbar-label">时间：</span>
      <button
        v-for="item in filters"
        :key="item.label"
        class="filter-pill"
        :class="{ active: item.active }"
        type="button"
      >
        {{ item.label }}
      </button>
    </section>

    <section class="hero">
      <h1>市场反馈看板</h1>
      <div class="underline"></div>
      <p>数据来源于微信聊天、外呼系统、录音工牌、友商直播间</p>
    </section>

    <section class="feedback-grid top-grid">
      <article
        v-for="panel in topPanels"
        :key="panel.title"
        class="feedback-card"
      >
        <header>
          <h2>{{ panel.title }}</h2>
        </header>

        <div class="panel-content">
          <section
            v-for="group in panel.groups"
            :key="group.title"
            class="content-group"
          >
            <h3>{{ group.title }}</h3>
            <ol v-if="group.items?.length">
              <li v-for="item in group.items" :key="item">{{ item }}</li>
            </ol>
            <p v-if="group.summary" class="summary" v-html="group.summary"></p>
          </section>
        </div>
      </article>
    </section>

    <section class="feedback-grid bottom-grid">
      <article class="feedback-card feedback-card--narrow">
        <header>
          <h2>{{ competitorPanel.title }}</h2>
        </header>

        <div class="panel-content">
          <section
            v-for="group in competitorPanel.groups"
            :key="group.title"
            class="content-group"
          >
            <h3>{{ group.title }}</h3>
            <ol>
              <li v-for="item in group.items" :key="item">{{ item }}</li>
            </ol>
          </section>
        </div>
      </article>

      <article class="feedback-card feedback-card--wide">
        <header>
          <h2>{{ streamPanel.title }}</h2>
        </header>

        <div class="wide-content">
          <div class="wide-column">
            <section
              v-for="group in streamPanel.leftGroups"
              :key="group.title"
              class="content-group"
            >
              <h3>{{ group.title }}</h3>
              <ul v-if="group.mode === 'plain'" class="plain-list">
                <li v-for="item in group.items" :key="item">{{ item }}</li>
              </ul>
              <div v-else-if="group.mode === 'tag'" class="tag-line">
                {{ group.items.join("、") }}
              </div>
            </section>
          </div>

          <div class="wide-column">
            <section class="content-group">
              <h3>{{ streamPanel.alertGroup.title }}</h3>
              <ul class="plain-list">
                <li v-for="item in streamPanel.alertGroup.items" :key="item">
                  {{ item }}
                </li>
              </ul>
            </section>
          </div>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
const router = useRouter();

const filters = [{ label: "当 周" }, { label: "当 月", active: true }];

const topPanels = [
  {
    title: "品牌战略反馈",
    groups: [
      {
        title: "正面评价",
        items: ["手串很有文化感", "吉星匹配很准，体验神奇", "包装很有档次"],
      },
      {
        title: "负面评价",
        items: ["客服回复太慢", "物流太慢，等了五天", "价格有点贵"],
      },
      {
        title: "",
        summary:
          "<strong>品牌满意度：</strong>65%（较上月 ↑ 5%）<br><strong>净推荐值NPS：</strong>42（较上周月 ↑ 2）",
      },
    ],
  },
  {
    title: "产品反馈",
    groups: [
      {
        title: "产品抱怨",
        items: [
          "手串价格比别家贵不少",
          "琉璃珠容易刮花",
          "包装盒子太简陋，送礼拿不出手",
          "五行珠缺土行，没法配全套",
        ],
      },
      {
        title: "产品需求",
        items: ["希望出木制款手串", "企业定制服务", "增加更多五行珠颜色选择"],
      },
      {
        title: "",
        summary: "<strong>产品满意度：</strong>72%（较上月 ↓ 3%）",
      },
    ],
  },
  {
    title: "服务反馈",
    groups: [
      {
        title: "服务抱怨",
        items: [
          "客服半天不回消息",
          "售后处理拖了一周",
          "客服对吉星文化不熟悉，问啥都不懂",
          "换货流程太麻烦",
        ],
      },
      {
        title: "服务改进建议",
        items: ["希望有24小时自助查询", "增加售后进度跟踪功能"],
      },
      {
        title: "",
        summary: "<strong>客服满意度：</strong>78%（较上月 ↓ 2%）",
      },
    ],
  },
];

const competitorPanel = {
  title: "客户反馈竞品",
  groups: [
    {
      title: "客户反馈中的竞品对比",
      items: [
        "甲家便宜多了，但质量不如你们",
        "乙家的包装更好看",
        "丙家的客服响应快，但产品没文化",
      ],
    },
  ],
};

const streamPanel = {
  title: "竞争对手直播间动态",
  leftGroups: [
    {
      title: "开播动态",
      mode: "plain",
      items: ["甲：3场（峰值2000人）", "乙：2场（峰值800人）"],
    },
    {
      title: "弹幕热词",
      mode: "tag",
      items: ["便宜", "质量好", "发货慢", "售后", "包装"],
    },
    {
      title: "用户对竞品评价摘要",
      mode: "plain",
      items: ["正面：性价比高", "负面：容易坏"],
    },
  ],
  alertGroup: {
    title: "预警信息",
    items: [
      "新品预警：甲推出新品“XXX”（黄色预警）",
      "营销预警：乙正在进行5折大促（红色预警）；甲开启“买一送一”活动（黄色预警）",
      "其他威胁：丙直播间观看量一周暴涨300%（待关注）",
    ],
  },
};
</script>

<style scoped lang="scss">
.feedback-page {
  position: relative;
  min-height: 100vh;
  padding: 22px 32px 32px;
  background: #fff;
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

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 48px;
  color: #858b97;
}

.toolbar-label {
  font-size: 15px;
}

.filter-pill {
  min-width: 64px;
  height: 32px;
  padding: 0 18px;
  color: #2f333a;
  background: #fff;
  border: 1px solid #2e72ff;
  border-radius: 999px;
  transition: 0.2s ease;

  &.active {
    color: #fff;
    background: #2e72ff;
    box-shadow: 0 8px 20px rgb(46 114 255 / 20%);
  }
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -24px;

  h1 {
    margin: 0;
    color: #2f333a;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: 2px;
  }

  p {
    margin: 10px 0 0;
    color: #8f96a3;
    font-size: 14px;
  }
}

.underline {
  width: 240px;
  height: 4px;
  margin-top: 8px;
  background: #1267ff;
  border-radius: 999px;
}

.feedback-grid {
  display: grid;
  gap: 26px;
  max-width: 1400px;
  margin-right: auto;
  margin-left: auto;
}

.top-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 32px;
}

.bottom-grid {
  grid-template-columns: 1fr 2fr;
  margin-top: 26px;
}

.feedback-card {
  min-height: 350px;
  padding: 16px 26px 20px;
  background: #fff;
  border: 1px solid #e9edf4;
  border-radius: 22px;
  box-shadow: 0 3px 12px rgb(29 42 66 / 10%);

  header {
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid #e4e8ef;
  }

  h2 {
    margin: 0;
    color: #2f333a;
    font-size: 18px;
    font-weight: 800;
  }
}

.feedback-card--narrow {
  min-height: 308px;
}

.feedback-card--wide {
  min-height: 308px;
}

.panel-content {
  color: #2f333a;
  font-size: 14px;
  line-height: 1.7;
}

.content-group + .content-group {
  margin-top: 14px;
}

.content-group h3 {
  margin: 0 0 6px;
  color: #2f333a;
  font-size: 15px;
  font-weight: 700;
}

.content-group ol,
.plain-list {
  padding-left: 24px;
  margin: 0;
}

.content-group li {
  margin-bottom: 2px;
  color: #3b404a;
}

.summary {
  margin: 4px 0 0;
  color: #3b404a;
  line-height: 1.8;
}

.wide-content {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 26px;
}

.wide-column {
  min-width: 0;
}

.tag-line {
  color: #3b404a;
  line-height: 1.7;
}
</style>
