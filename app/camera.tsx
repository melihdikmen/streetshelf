import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button } from '../src/components';
import { styles } from '../src/screens/camera.styles';
import { useSession } from '../src/stores/session';
import { colors } from '../src/theme/tokens';

type Kind = 'pickup' | 'return';

/**
 * Full-screen capture for the handover and return photos. Viewfinder with
 * a single big shutter in the thumb zone; the preview offers retake or use.
 * On a simulator (no camera) the gallery button does the same job.
 */
export default function CameraScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { transactionId, kind } = useLocalSearchParams<{
    transactionId: string;
    conversationId: string;
    kind: Kind;
  }>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const confirmWithPhoto = useSession((s) => s.confirmWithPhoto);
  const showError = useSession((s) => s.showError);
  const [uploading, setUploading] = useState(false);

  const isPickup = kind !== 'return';

  const capture = async () => {
    const result = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    if (result?.uri) setPhoto(result.uri);
  };

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) setPhoto(result.assets[0]?.uri ?? null);
  };

  // Uploads, then records the step. The photo card reaches the thread over
  // Realtime, so this screen only has to close on success.
  const use = async () => {
    if (!photo) return;
    setUploading(true);
    try {
      await confirmWithPhoto(transactionId, isPickup ? 'pickup' : 'return', photo);
      router.back();
    } catch (error) {
      showError(error);
    } finally {
      setUploading(false);
    }
  };

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.close}>
        <MaterialCommunityIcons name="close" size={24} color={colors.textOnDark} />
      </Pressable>
      <View style={styles.headerText}>
        <AppText variant="bodyBold" tone="onDark">
          {isPickup ? t('camera.pickupTitle') : t('camera.returnTitle')}
        </AppText>
        <AppText variant="caption" tone="onDark" style={styles.hint}>
          {t('camera.hint')}
        </AppText>
      </View>
    </View>
  );

  if (photo) {
    return (
      <View style={styles.root}>
        <Image source={{ uri: photo }} style={styles.preview} contentFit="cover" />
        {header}
        <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
          <Button label={t('camera.retake')} variant="secondary" disabled={uploading} onPress={() => setPhoto(null)} />
          <View style={styles.actionGrow}>
            <Button label={t('camera.use')} variant="accent" size="lg" icon="check" fullWidth loading={uploading} onPress={use} />
          </View>
        </View>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.permission}>
          <MaterialCommunityIcons name="camera-off-outline" size={48} color={colors.textOnDark} />
          <AppText tone="onDark" style={styles.centered}>
            {t('camera.permission')}
          </AppText>
          <Button label={t('camera.grant')} variant="accent" onPress={() => void requestPermission()} />
          <Button label={t('camera.gallery')} variant="ghost" onPress={pick} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      {header}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable accessibilityRole="button" onPress={pick} style={styles.sideButton}>
          <MaterialCommunityIcons name="image-multiple-outline" size={26} color={colors.textOnDark} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('camera.capture')} onPress={capture} style={styles.shutterOuter}>
          <View style={styles.shutterInner} />
        </Pressable>
        <View style={styles.sideButton} />
      </View>
    </View>
  );
}
