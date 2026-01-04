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
        
    return original_url
