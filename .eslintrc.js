module.exports = {
	env: {
		browser: true,
		es2021: true,
		node: true
	},
	extends: [
		'standard-with-typescript',
		// 1. 接入 prettier 的规则
		'prettier',
		'plugin:prettier/recommended'
	],
	overrides: [],
	// 2. 加入 prettier 的 eslint 插件
	plugins: ['@typescript-eslint', 'prettier'],
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module'
	},
	rules: {
		// 3. 注意要加上这一句，开启 prettier 自动修复的功能
		'prettier/prettier': 'error'
	}
};
