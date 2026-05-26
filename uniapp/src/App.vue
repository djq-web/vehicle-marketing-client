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
</style>
