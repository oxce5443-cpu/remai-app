<template>
  <view class="bread-loader">
    <!-- 蒸汽 -->
    <view class="steam-container">
      <view class="steam s1"></view>
      <view class="steam s2"></view>
      <view class="steam s3"></view>
    </view>
    <!-- 面包主体 -->
    <view class="bread-body">
      <!-- 顶部脆皮 -->
      <view class="bread-crust">
        <view class="crust-line l1"></view>
        <view class="crust-line l2"></view>
        <view class="crust-line l3"></view>
      </view>
      <!-- 脸部 -->
      <view class="bread-face">
        <!-- 腮红 -->
        <view class="blush blush-left"></view>
        <view class="blush blush-right"></view>
        <!-- 眼睛 -->
        <view class="eyes">
          <view class="eye eye-left">
            <view class="pupil"></view>
            <view class="sparkle"></view>
          </view>
          <view class="eye eye-right">
            <view class="pupil"></view>
            <view class="sparkle"></view>
          </view>
        </view>
        <!-- 嘴巴 -->
        <view class="mouth"></view>
      </view>
    </view>
    <!-- 阴影 -->
    <view class="bread-shadow"></view>
    <!-- 文字 -->
    <view class="bread-text">新鲜烘焙中...</view>
  </view>
</template>

<script>
export default {
  name: 'LoadingBread',
  props: {
    size: { type: Number, default: 240 },
    text: { type: String, default: '新鲜烘焙中...' }
  }
}
</script>

<style lang="scss" scoped>
.bread-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* ═══════════ 蒸汽 ═══════════ */
.steam-container {
  position: relative;
  height: 56rpx;
  margin-bottom: -8rpx;
  z-index: 2;
}

.steam {
  position: absolute;
  bottom: 0;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: rgba(200, 180, 160, .6);
  animation: steam-rise 2s ease-in-out infinite;
  opacity: 0;

  &.s1 { left: 50%; margin-left: -40rpx; animation-delay: 0s; }
  &.s2 { left: 50%; margin-left: -7rpx;  animation-delay: .7s; width: 18rpx; height: 18rpx; }
  &.s3 { left: 50%; margin-left: 26rpx;  animation-delay: 1.4s; }
}

@keyframes steam-rise {
  0%   { opacity: 0; transform: translateY(0) scale(.6); }
  20%  { opacity: .8; }
  50%  { opacity: .4; transform: translateY(-36rpx) scale(1.4); }
  100% { opacity: 0; transform: translateY(-52rpx) scale(1.8); }
}

/* ═══════════ 面包主体 ═══════════ */
.bread-body {
  width: 180rpx;
  height: 160rpx;
  background: linear-gradient(180deg, #E8C07A 0%, #D4A24E 40%, #C08A3A 100%);
  border-radius: 60rpx 60rpx 36rpx 36rpx;
  position: relative;
  z-index: 1;
  animation: bread-bounce 1.8s ease-in-out infinite;
  box-shadow:
    inset 0 -12rpx 24rpx rgba(150, 90, 30, .25),
    0 8rpx 28rpx rgba(180, 120, 50, .35);
  overflow: visible;
}

/* 顶部脆皮裂纹 */
.bread-crust {
  position: absolute;
  top: -4rpx;
  left: 30rpx;
  right: 30rpx;
  height: 40rpx;
  display: flex;
  justify-content: center;
  gap: 14rpx;
  align-items: flex-start;
}

.crust-line {
  width: 6rpx;
  border-radius: 3rpx;
  background: rgba(160, 100, 30, .5);
  animation: crust-crack 3s ease-in-out infinite;

  &.l1 { height: 36rpx; transform: rotate(-8deg); animation-delay: 0s; }
  &.l2 { height: 28rpx; transform: rotate(2deg);  animation-delay: .8s; }
  &.l3 { height: 34rpx; transform: rotate(10deg); animation-delay: 1.6s; }
}

@keyframes crust-crack {
  0%, 100% { opacity: .3; }
  50% { opacity: .65; }
}

/* ═══════════ 脸部 ═══════════ */
.bread-face {
  position: absolute;
  top: 48rpx;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 腮红 */
.blush {
  position: absolute;
  width: 28rpx;
  height: 18rpx;
  border-radius: 50%;
  background: rgba(255, 160, 140, .35);
  top: 30rpx;

  &-left  { left: 32rpx; }
  &-right { right: 32rpx; }
}

/* 眼睛 */
.eyes {
  display: flex;
  gap: 30rpx;
  margin-bottom: 6rpx;
}

.eye {
  width: 24rpx;
  height: 26rpx;
  border-radius: 50%;
  background: #3D2E28;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: eye-blink 4s ease-in-out infinite;
}

.pupil {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #1A1410;
}

.sparkle {
  position: absolute;
  top: 3rpx;
  right: 4rpx;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #FFF;
  opacity: .9;
}

@keyframes eye-blink {
  0%, 94%, 100% { transform: scaleY(1); }
  96% { transform: scaleY(.08); }
}

/* 嘴巴 */
.mouth {
  width: 20rpx;
  height: 10rpx;
  border-radius: 0 0 20rpx 20rpx;
  border: 3rpx solid #7A5030;
  border-top: none;
  margin-top: 2rpx;
}

/* ═══════════ 阴影 ═══════════ */
.bread-shadow {
  width: 120rpx;
  height: 18rpx;
  border-radius: 50%;
  background: rgba(120, 90, 50, .18);
  margin-top: -4rpx;
  z-index: 0;
  animation: shadow-pulse 1.8s ease-in-out infinite;
}

@keyframes shadow-pulse {
  0%, 100% { transform: scale(.8); opacity: .4; }
  50%      { transform: scale(1.1); opacity: .7; }
}

/* ═══════════ 弹跳 ═══════════ */
@keyframes bread-bounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  15%      { transform: translateY(-18rpx) rotate(-3deg); }
  30%      { transform: translateY(0) rotate(1deg); }
  45%      { transform: translateY(-8rpx) rotate(-1deg); }
  60%      { transform: translateY(0) rotate(0deg); }
}

/* ═══════════ 文字 ═══════════ */
.bread-text {
  margin-top: 28rpx;
  font-size: 26rpx;
  color: #8C7A6B;
  font-weight: 400;
  letter-spacing: 2rpx;
  animation: text-fade 2s ease-in-out infinite;
}

@keyframes text-fade {
  0%, 100% { opacity: .6; }
  50% { opacity: 1; }
}
</style>
