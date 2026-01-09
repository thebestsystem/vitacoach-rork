
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle, RefreshCw, X } from 'lucide-react-native';
import colors from '@/constants/colors';
import { UserFriendlyError } from '@/utils/firebaseErrors';

interface InlineErrorProps {
    error: UserFriendlyError | null;
    onRetry?: () => void;
    onDismiss?: () => void;
}

export function InlineError({ error, onRetry, onDismiss }: InlineErrorProps) {
    if (!error) return null;

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <AlertTriangle size={20} color={colors.error} style={styles.icon} />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{error.title}</Text>
                    <Text style={styles.message}>{error.message}</Text>
                </View>
            </View>
            <View style={styles.actions}>
                {onRetry && (
                    <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
                        <RefreshCw size={16} color={colors.primary} />
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                )}
                {onDismiss && (
                    <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
                        <X size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: colors.error,
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    icon: {
        marginTop: 2,
        marginRight: 10,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.error,
        marginBottom: 2,
    },
    message: {
        fontSize: 12,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 8,
        gap: 16,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    retryText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.primary,
    },
    dismissButton: {
        padding: 4,
    },
});
