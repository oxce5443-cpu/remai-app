<script setup>
import { t } from '@/locale'

import { ref, onMounted } from 'vue'
import { adminRequest } from '@/utils/api.js'
import { ElMessage, ElMessageBox } from 'element-plus'

// 分类列表
const categories = ref([])

// 加载状态
const loading = ref(false)

// 表格列定义
const columns = [
  { prop: 'name', label: '分类名称', width: 200 },
  { prop: 'sort', label: '排序', width: 100 },
  { prop: 'status', label: '显示状态', width: 120 }
]

// -dialogformvisible
const dialogVisible = ref(false)
const dialogTitle = ref('新增分类')

// 表单数据
const formData = ref({
  _id: '',
  name: '',
  name_en: '',
  sort: 0,
  status: true
})

// 表单规则
const rules = {
  name: [{ required: true, get message() { return t("请输入分类名称") }, trigger: 'blur' }]
}

const formRef = ref(null)

onMounted(() => {
  fetchCategories()
})

// 获取分类列表
async function fetchCategories() {
  try {
    loading.value = true
    const data = await adminRequest('getCategories')
    categories.value = data || []
  } catch (e) {
    console.error('获取分类失败:', e)
    ElMessage.error(t('加载分类失败'))
  } finally {
    loading.value = false
  }
}

// 新增分类
function handleAdd() {
  dialogTitle.value = '新增分类'
  formData.value = {
    _id: '',
    name: '',
    name_en: '',
    sort: 0,
    status: true
  }
  dialogVisible.value = true
}

// 编辑分类
function handleEdit(row) {
  dialogTitle.value = '编辑分类'
  formData.value = {
    _id: row._id,
    name: row.name,
    name_en: row.name_en || '',
    sort: row.sort || 0,
    status: row.status !== false
  }
  dialogVisible.value = true
}

// 删除分类
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(t('确定要删除该分类吗？'), t('提示'), {
      confirmButtonText: t('确定'),
      cancelButtonText: t('取消'),
      type: 'warning'
    })

    await adminRequest('deleteCategory', { id: row._id })
    ElMessage.success(t('删除成功'))
    fetchCategories()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('删除分类失败:', e)
      ElMessage.error(t('删除失败'))
    }
  }
}

// 切换显示状态
async function handleStatusChange(row) {
  try {
    await adminRequest('updateCategory', {
      id: row._id,
      status: row.status
    })
    ElMessage.success(t('状态更新成功'))
  } catch (e) {
    console.error('更新状态失败:', e)
    // 恢复原状态
    row.status = !row.status
    ElMessage.error(t('更新失败'))
  }
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    const params = {
      name: formData.value.name,
      name_en: formData.value.name_en,
      sort: formData.value.sort,
      status: formData.value.status
    }

    if (formData.value._id) {
      params.id = formData.value._id
      await adminRequest('updateCategory', params)
      ElMessage.success(t('更新成功'))
    } else {
      await adminRequest('addCategory', params)
      ElMessage.success(t('添加成功'))
    }

    dialogVisible.value = false
    fetchCategories()
  } catch (e) {
    if (e !== false) {
      console.error('提交失败:', e)
      ElMessage.error(t('提交失败'))
    }
  }
}

// 取消弹窗
function handleCancel() {
  dialogVisible.value = false
}
</script>

<template>
  <view class="category-page">
    <LanguageSwitch />
    <!-- 工具栏 -->
    <view class="toolbar">
      <el-button type="primary" @tap="handleAdd">{{ $t("新增分类") }}</el-button>
    </view>

    <!-- 分类表格 -->
    <view class="table-container">
      <el-table
        v-loading="loading"
        :data="categories"
        style="width: 100%"
        row-key="_id"
      >
        <el-table-column prop="name" :label="$t(&quot;分类名称&quot;)" min-width="200" />
        <el-table-column prop="sort" :label="$t(&quot;排序&quot;)" width="120" align="center" />
        <el-table-column :label="$t(&quot;显示状态&quot;)" width="150" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status !== false"
              active-color="#ADB838"
              inactive-color="#dcdee0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column :label="$t(&quot;操作&quot;)" width="180" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @tap="handleEdit(row)">{{ $t("编辑") }}</el-button>
            <el-button link type="danger" size="small" @tap="handleDelete(row)">{{ $t("删除") }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </view>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item :label="$t(&quot;分类名称&quot;)" prop="name">
          <el-input v-model="formData.name" :placeholder="$t(&quot;请输入分类名称&quot;)" />
        </el-form-item>
        <el-form-item :label="$t(&quot;英文名称&quot;)">
          <el-input v-model="formData.name_en" :placeholder="$t(&quot;可选；英文界面未填写时显示原名称&quot;)" />
        </el-form-item>
        <el-form-item :label="$t(&quot;排序&quot;)">
          <el-input-number v-model="formData.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item :label="$t(&quot;显示状态&quot;)">
          <el-switch
            v-model="formData.status"
            active-color="#ADB838"
            inactive-color="#dcdee0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @tap="handleCancel">{{ $t("取消") }}</el-button>
        <el-button type="primary" @tap="handleSubmit">{{ $t("确定") }}</el-button>
      </template>
    </el-dialog>
  </view>
</template>

<style scoped>
@import '../../uni.scss';

.category-page {
  padding: 20rpx;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.toolbar {
  margin-bottom: 20rpx;
}

.table-container {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
}

/* Element Plus 样式适配 */
:deep(.el-table) {
  font-size: 28rpx;
}

:deep(.el-table__header-wrapper) {
  font-size: 28rpx;
}

:deep(.el-button) {
  font-size: 24rpx;
}

:deep(.el-dialog) {
  border-radius: 16rpx;
}

:deep(.el-form-item__label) {
  font-size: 28rpx;
}

:deep(.el-input__inner) {
  font-size: 28rpx;
}
</style>
