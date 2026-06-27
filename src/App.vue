<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
onLaunch(() => {
  console.log("Vehicle Marketing App Launch");
});
onShow(() => {
  console.log("Vehicle Marketing App Show");
});
onHide(() => {
  console.log("Vehicle Marketing App Hide");
});
</script>

<style>
page {
  min-height: 100%;
  color: #1f2937;
  background: #f4f7fb;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei",
    Arial, sans-serif;
}

view,
text,
button,
input,
textarea {
  box-sizing: border-box;
}

button {
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  line-height: 1;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

button::after {
  border: 0;
}

uni-scroll-view,
uni-scroll-view .uni-scroll-view,
.uni-scroll-view {
  scrollbar-width: auto;
}

/* #ifdef H5 */

uni-scroll-view::-webkit-scrollbar,
uni-scroll-view .uni-scroll-view::-webkit-scrollbar,
.uni-scroll-view::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-button {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
  -webkit-appearance: none;
}

uni-scroll-view::-webkit-scrollbar-button,
uni-scroll-view .uni-scroll-view::-webkit-scrollbar-button,
.uni-scroll-view::-webkit-scrollbar-button,
uni-scroll-view::-webkit-scrollbar-button:vertical:start:decrement,
uni-scroll-view::-webkit-scrollbar-button:vertical:end:increment,
uni-scroll-view .uni-scroll-view::-webkit-scrollbar-button:vertical:start:decrement,
uni-scroll-view .uni-scroll-view::-webkit-scrollbar-button:vertical:end:increment,
.uni-scroll-view::-webkit-scrollbar-button:vertical:start:decrement,
.uni-scroll-view::-webkit-scrollbar-button:vertical:end:increment {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
  -webkit-appearance: none;
}

uni-scroll-view::-webkit-scrollbar-track,
uni-scroll-view::-webkit-scrollbar-corner,
uni-scroll-view .uni-scroll-view::-webkit-scrollbar-track,
uni-scroll-view .uni-scroll-view::-webkit-scrollbar-corner,
.uni-scroll-view::-webkit-scrollbar-track,
.uni-scroll-view::-webkit-scrollbar-corner {
  background: transparent;
}

uni-scroll-view::-webkit-scrollbar-thumb,
uni-scroll-view .uni-scroll-view::-webkit-scrollbar-thumb,
.uni-scroll-view::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 999px;
}

uni-scroll-view:hover::-webkit-scrollbar-track,
uni-scroll-view:hover::-webkit-scrollbar-corner,
uni-scroll-view:hover .uni-scroll-view::-webkit-scrollbar-track,
uni-scroll-view:hover .uni-scroll-view::-webkit-scrollbar-corner,
.uni-scroll-view:hover::-webkit-scrollbar-track,
.uni-scroll-view:hover::-webkit-scrollbar-corner {
  background: transparent;
}

uni-scroll-view:hover::-webkit-scrollbar-thumb,
uni-scroll-view:hover .uni-scroll-view::-webkit-scrollbar-thumb,
.uni-scroll-view:hover::-webkit-scrollbar-thumb {
  background-color: #d4d4d4;
}
/* #endif */
</style>
