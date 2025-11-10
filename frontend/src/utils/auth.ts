export const isAuthenticated = () => {
    return !!localStorage.getItem("access");
};

export const getAuthHeader = () => {
    const token = localStorage.getItem("access");
    return token ? `Bearer ${token}` : "";
};

export const refreshToken = async () => {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) return false;

    try {
        const response = await fetch("http://127.0.0.1:8000/api/token/refresh/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh }),
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("access", data.access);
            return true;
        }
        return false;
    } catch {
        return false;
    }
};

export const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    window.location.href = "/login";
};
