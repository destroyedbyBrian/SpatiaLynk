export const PERMISSIONS = {
    'unregistered': {
        canGeneratePrompts: false,
        canViewSearchHistory: false,
        canUpdateProfile: false,
    },
    'free_user': {
        canGeneratePrompts: true,
        canViewSearchHistory: true,
        canUpdateProfile: true,

    },
    'business': {
        canGeneratePrompts: false,
        canViewSearchHistory: false,
        canUpdateProfile: true,
    },
    'admin': {
        canGeneratePrompts: false,
        canViewSearchHistory: false,
        canUpdateProfile: true,
    }
}

export const hasPermission = (userRole, permission) => {
    return PERMISSIONS[userRole]?.[permission] || false
}