def get_smart_link(original_url: str) -> str:
    """
    Apply zero-cost acceleration strategies to download URLs.
    """
    if not original_url:
        return ""

    # VS Code / Azure CDN Mirror
    if "az764295.vo.msecnd.net" in original_url:
        return original_url.replace("az764295.vo.msecnd.net", "vscode.cdn.azure.cn")
    
    if "vscode.download.prss.microsoft.com" in original_url:
        return original_url.replace("vscode.download.prss.microsoft.com", "vscode.cdn.azure.cn")
    
    # GitHub Proxy
    if "github.com" in original_url and "/releases/download/" in original_url:
        # Using a common public proxy for demo purposes. 
        # In production, this might be a configurable environment variable.
        proxy_prefix = "https://ghproxy.cn/" 
        return f"{proxy_prefix}{original_url}"
    
    # Node.js Mirror (Huawei)
    if "nodejs.org/dist" in original_url:
        return original_url.replace("nodejs.org/dist", "mirrors.huaweicloud.com/nodejs")
    
    # Python Mirror (Huawei)
    if "www.python.org/ftp/python" in original_url:
        return original_url.replace("www.python.org/ftp/python", "mirrors.huaweicloud.com/python")
    
    # Go Mirror (TUNA/USTC)
    if "go.dev/dl" in original_url:
        return original_url.replace("go.dev/dl", "mirrors.ustc.edu.cn/golang")
    
    # Java (Adoptium/TUNA)
    if "github.com/adoptium" in original_url and "/releases/download/" in original_url:
        proxy_prefix = "https://ghproxy.cn/" 
        return f"{proxy_prefix}{original_url}"
        
    return original_url
