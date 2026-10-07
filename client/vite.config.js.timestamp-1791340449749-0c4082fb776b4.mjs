// vite.config.js
import { defineConfig } from "file:///C:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/client/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/client/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    port: 3e3,
    proxy: {
      "/auth": "http://localhost:5000",
      "/admin": "http://localhost:5000",
      "/artifacts": "http://localhost:5000",
      "/recovered": "http://localhost:5000",
      "/cases": "http://localhost:5000",
      "/stats": "http://localhost:5000",
      "/uploads": "http://localhost:5000",
      "/api": "http://localhost:5000"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxEZWxsXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxccGVwLXByb2plY3QtMlxcXFxwZXAtcHJvamVjdC0yXFxcXGNsaWVudFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcRGVsbFxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXHBlcC1wcm9qZWN0LTJcXFxccGVwLXByb2plY3QtMlxcXFxjbGllbnRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0RlbGwvT25lRHJpdmUvRGVza3RvcC9wZXAtcHJvamVjdC0yL3BlcC1wcm9qZWN0LTIvY2xpZW50L3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXV0aCc6ICdodHRwOi8vbG9jYWxob3N0OjUwMDAnLFxuICAgICAgJy9hZG1pbic6ICdodHRwOi8vbG9jYWxob3N0OjUwMDAnLFxuICAgICAgJy9hcnRpZmFjdHMnOiAnaHR0cDovL2xvY2FsaG9zdDo1MDAwJyxcbiAgICAgICcvcmVjb3ZlcmVkJzogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMCcsXG4gICAgICAnL2Nhc2VzJzogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMCcsXG4gICAgICAnL3N0YXRzJzogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMCcsXG4gICAgICAnL3VwbG9hZHMnOiAnaHR0cDovL2xvY2FsaG9zdDo1MDAwJyxcbiAgICAgICcvYXBpJzogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMCdcbiAgICB9XG4gIH1cbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFxWSxTQUFTLG9CQUFvQjtBQUNsYSxPQUFPLFdBQVc7QUFFbEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFNBQVM7QUFBQSxNQUNULFVBQVU7QUFBQSxNQUNWLGNBQWM7QUFBQSxNQUNkLGNBQWM7QUFBQSxNQUNkLFVBQVU7QUFBQSxNQUNWLFVBQVU7QUFBQSxNQUNWLFlBQVk7QUFBQSxNQUNaLFFBQVE7QUFBQSxJQUNWO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
