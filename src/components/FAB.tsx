import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type FABProps = {
  onPress: () => void;
};

export function FAB({ onPress }: FABProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Create project"
      style={{
        position: 'absolute',
        bottom: 100,
        right: 22,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f97316',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
        elevation: 10,
        zIndex: 100,
      }}
    >
      <Ionicons name="add" size={30} color="#fff" />
    </TouchableOpacity>
  );
}
