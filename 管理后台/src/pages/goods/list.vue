<template>
  <view class="goods-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商品管理</span>
          <el-button type="primary" @click="handleAdd">新增商品</el-button>
        </div>
      </template>

      <el-table :data="goodsList" border stripe>
        <el-table-column label="商品图片" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.image"
              :src="row.image"
              fit="cover"
              style="width: 60px; height: 60px"
              :preview-src-list="[row.image]"
            />
            <view v-else class="no-image">无图</view>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="150" />
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            ¥{{ formatMoney(row.price) }}
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column label="上架状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_sell ? 'success' : 'info'">
              {{ row.is_sell ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑商品' : '新增商品'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品分类" prop="category_id">
          <el-select v-model="form.category_id" placeholder="请选择分类">
            <el-option
              v-for="item in categoryOptions"
              :key="item._id"
              :label="item.name"
              :value="item._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" :precision="0" />
        </el-form-item>
        <el-form-item label="上架状态">
          <el-radio-group v-model="form.is_sell">
            <el-radio :label="true">上架</el-radio>
            <el-radio :label="false">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="商品图片">
          <view class="image-upload">
            <el-image
              v-if="form.image"
              :src="form.image"
              fit="cover"
              style="width: 100px; height: 100px"
            />
            <el-button v-if="!form.image" @click="chooseImage">选择图片</el-button>
            <el-button v-else type="danger" size="small" @click="form.image = ''">移除</el-button>
          </view>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminRequest, formatMoney } from '@/utils/api.js'

const goodsList = ref([])
const categoryOptions = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const form = reactive({
  id: '',
  name: '',
  category_id: '',
  price: 0,
  stock: 0,
  is_sell: true,
  image: ''
})

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }]
}

onMounted(async () => {
  await loadCategories()
  await loadGoods()
})

async function loadCategories() {
  try {
    const data = await adminRequest('getCategories')
    categoryOptions.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('加载分类失败', e)
  }
}

async function loadGoods() {
  try {
    const data = await adminRequest('getAllGoods')
    const categoryMap = new Map(categoryOptions.value.map(item => [item._id, item.name]))
    goodsList.value = (data || []).map(item => ({
      ...item,
      category_name: categoryMap.get(item.category_id) || item.category_name || '-'
    }))
  } catch (e) {
    console.error('加载商品失败', e)
  }
}

function handleAdd() {
  isEdit.value = false
  Object.assign(form, {
    id: '',
    name: '',
    category_id: '',
    price: 0,
    stock: 0,
    is_sell: true,
    image: ''
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  Object.assign(form, {
    id: row._id || row.id,
    name: row.name,
    category_id: row.category_id,
    price: row.price,
    stock: row.stock,
    is_sell: row.is_sell !== false,
    image: row.image || ''
  })
  dialogVisible.value = true
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？', '提示', {
      type: 'warning'
    })
    await adminRequest('deleteGoods', { id: row._id || row.id })
    ElMessage.success('删除成功')
    loadGoods()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('删除失败', e)
    }
  }
}

function chooseImage() {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      uni.uploadFile({
        url: 'https://your-upload-url.com/upload',
        filePath: tempFilePath,
        name: 'file',
        success: (uploadRes) => {
          const data = JSON.parse(uploadRes.data)
          form.image = data.url
        }
      })
    }
  })
}

async function submitForm() {
  try {
    await formRef.value.validate()
    if (isEdit.value) {
      await adminRequest('updateGoods', { ...form })
      ElMessage.success('更新成功')
    } else {
      await adminRequest('addGoods', { ...form })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    await loadCategories()
    loadGoods()
  } catch (e) {
    console.error('提交失败', e)
  }
}
</script>

<style scoped>
.goods-container {
  padding: 20rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.no-image {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #999;
  font-size: 12px;
}

.image-upload {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
