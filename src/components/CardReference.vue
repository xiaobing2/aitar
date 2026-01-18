<template>
  <div class="card-reference">
    <img src="/aa.png" alt="参考卡片效果" class="reference-image" />
  </div>
</template>

<script>
export default {
  name: 'CardReference'
}
</script>

<style scoped>
.card-reference {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  max-height: 600px;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.reference-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}
</style>

