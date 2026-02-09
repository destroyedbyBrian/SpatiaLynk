export const PERMISSIONS = {
    'unregistered': {
        canGeneratePrompts: false
    },
    'free_user': {
        canGeneratePrompts: true
    },
    'business': {
        canGeneratePrompts: false
    },
    'admin': {
        canGeneratePrompts: false
    }
}

export const hasPermission = (userRole, permission) => {
    return PERMISSIONS[userRole]?.[permission] || false
}