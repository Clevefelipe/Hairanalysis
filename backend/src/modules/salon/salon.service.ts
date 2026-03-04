import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalonEntity } from './salon.entity';
import { UpdateSalonBrandingDto } from './dto/update-salon-branding.dto';

const DEFAULT_PRIMARY_COLOR = '#0F172A';
const DEFAULT_SECONDARY_COLOR = '#E2E8F0';
const DEFAULT_ACCENT_COLOR = '#0EA5A4';
const DEFAULT_FONT_FAMILY = 'helvetica';
const SUPPORTED_FONT_FAMILIES = ['helvetica', 'times', 'courier'] as const;
type SupportedFontFamily = (typeof SUPPORTED_FONT_FAMILIES)[number];

type BrandingPreset = {
  id: string;
  segment: 'clinica_estetica' | 'salao_beleza';
  label: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: SupportedFontFamily;
};

const BRANDING_PRESETS: BrandingPreset[] = [
  {
    id: 'clinica_estetica',
    segment: 'clinica_estetica',
    label: 'Cl\u00ednica Est\u00e9tica',
    description:
      'Visual s\u00f3brio, t\u00e9cnico e premium para cl\u00ednicas de est\u00e9tica capilar.',
    primaryColor: '#12355B',
    secondaryColor: '#E6EEF8',
    accentColor: '#1E88E5',
    fontFamily: 'times',
  },
  {
    id: 'salao_beleza',
    segment: 'salao_beleza',
    label: 'Sal\u00e3o de Beleza',
    description:
      'Visual moderno e acolhedor para opera\u00e7\u00e3o comercial de sal\u00e3o.',
    primaryColor: '#0B3D2E',
    secondaryColor: '#E8F5EF',
    accentColor: '#22A06B',
    fontFamily: 'helvetica',
  },
];

type BrandingPayload = {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: SupportedFontFamily;
};

@Injectable()
export class SalonService {
  constructor(
    @InjectRepository(SalonEntity)
    private readonly salonRepository: Repository<SalonEntity>,
  ) {}

  async getBrandingBySalonId(salonId: string) {
    const salon = await this.findSalonOrFail(salonId);
    return this.toBrandingResponse(salon);
  }

  getBrandingPresets() {
    return BRANDING_PRESETS.map((preset) => ({ ...preset }));
  }

  async updateBrandingBySalonId(
    salonId: string,
    payload: UpdateSalonBrandingDto,
  ) {
    const salon = await this.findSalonOrFail(salonId);
    const current = this.extractCurrentBranding(salon);

    const next: BrandingPayload = {
      logoUrl:
        payload.logoUrl !== undefined
          ? this.normalizeLogoUrl(payload.logoUrl)
          : current.logoUrl,
      primaryColor:
        payload.primaryColor !== undefined
          ? this.normalizeHexColor(payload.primaryColor, 'primaryColor')
          : current.primaryColor,
      secondaryColor:
        payload.secondaryColor !== undefined
          ? this.normalizeHexColor(payload.secondaryColor, 'secondaryColor')
          : current.secondaryColor,
      accentColor:
        payload.accentColor !== undefined
          ? this.normalizeHexColor(payload.accentColor, 'accentColor')
          : current.accentColor,
      fontFamily:
        payload.fontFamily !== undefined
          ? this.normalizeFontFamily(payload.fontFamily)
          : current.fontFamily,
    };

    const mergedBranding = this.buildMergedBranding(salon, next, {
      presetId: 'custom',
      presetSegment: undefined,
      presetLabel: 'Custom',
    });

    salon.logoUrl = next.logoUrl || undefined;
    salon.brandPrimaryColor = next.primaryColor;
    salon.brandSecondaryColor = next.secondaryColor;
    salon.brandAccentColor = next.accentColor;
    salon.brandFontFamily = next.fontFamily;
    salon.branding = mergedBranding as Record<string, any>;

    const saved = await this.salonRepository.save(salon);
    return this.toBrandingResponse(saved);
  }

  async updateLogoBySalonId(salonId: string, logoUrl: string) {
    return this.updateBrandingBySalonId(salonId, { logoUrl });
  }

  async clearLogoBySalonId(salonId: string) {
    return this.updateBrandingBySalonId(salonId, { logoUrl: '' });
  }

  async applyBrandingPresetBySalonId(salonId: string, presetId: string) {
    const preset = this.findPresetOrFail(presetId);
    const salon = await this.findSalonOrFail(salonId);
    const current = this.extractCurrentBranding(salon);

    const next: BrandingPayload = {
      logoUrl: current.logoUrl,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      fontFamily: preset.fontFamily,
    };

    const mergedBranding = this.buildMergedBranding(salon, next, {
      presetId: preset.id,
      presetSegment: preset.segment,
      presetLabel: preset.label,
    });

    salon.brandPrimaryColor = next.primaryColor;
    salon.brandSecondaryColor = next.secondaryColor;
    salon.brandAccentColor = next.accentColor;
    salon.brandFontFamily = next.fontFamily;
    salon.branding = mergedBranding as Record<string, any>;

    const saved = await this.salonRepository.save(salon);
    return this.toBrandingResponse(saved);
  }

  private async findSalonOrFail(salonId: string) {
    if (!salonId || !String(salonId).trim()) {
      throw new BadRequestException('salonId \u00e9 obrigat\u00f3rio');
    }

    const salon = await this.salonRepository.findOne({
      where: { id: salonId },
    });

    if (!salon) {
      throw new NotFoundException('Sal\u00e3o n\u00e3o encontrado');
    }

    return salon;
  }

  private toBrandingResponse(salon: SalonEntity) {
    const branding = this.extractCurrentBranding(salon);
    const currentPresetId =
      salon.branding &&
      typeof salon.branding === 'object' &&
      typeof (salon.branding as any).presetId === 'string'
        ? String((salon.branding as any).presetId)
        : 'custom';

    return {
      salonId: salon.id,
      salonName: salon.name,
      branding: {
        logoUrl: branding.logoUrl,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        accentColor: branding.accentColor,
        fontFamily: branding.fontFamily,
      },
      currentPresetId,
      supportedFonts: [...SUPPORTED_FONT_FAMILIES],
    };
  }

  private extractCurrentBranding(salon: SalonEntity): BrandingPayload {
    const brandingSource =
      salon.branding && typeof salon.branding === 'object'
        ? salon.branding
        : {};

    const logoUrl =
      this.normalizeLogoUrl(
        String(
          salon.logoUrl ||
            brandingSource.logoUrl ||
            brandingSource?.header?.logoUrl ||
            brandingSource?.pdf?.logoUrl ||
            '',
        ),
      ) || null;

    const primaryColor = this.normalizeHexColor(
      String(
        salon.brandPrimaryColor ||
          brandingSource.brandPrimaryColor ||
          brandingSource.primaryColor ||
          brandingSource?.header?.brandPrimaryColor ||
          brandingSource?.pdf?.brandPrimaryColor ||
          DEFAULT_PRIMARY_COLOR,
      ),
      'primaryColor',
      DEFAULT_PRIMARY_COLOR,
    );

    const secondaryColor = this.normalizeHexColor(
      String(
        salon.brandSecondaryColor ||
          brandingSource.brandSecondaryColor ||
          brandingSource.secondaryColor ||
          brandingSource?.header?.brandSecondaryColor ||
          brandingSource?.pdf?.brandSecondaryColor ||
          DEFAULT_SECONDARY_COLOR,
      ),
      'secondaryColor',
      DEFAULT_SECONDARY_COLOR,
    );

    const accentColor = this.normalizeHexColor(
      String(
        salon.brandAccentColor ||
          brandingSource.brandAccentColor ||
          brandingSource.accentColor ||
          brandingSource?.header?.brandAccentColor ||
          brandingSource?.pdf?.brandAccentColor ||
          DEFAULT_ACCENT_COLOR,
      ),
      'accentColor',
      DEFAULT_ACCENT_COLOR,
    );

    const fontFamily = this.normalizeFontFamily(
      String(
        salon.brandFontFamily ||
          brandingSource.brandFontFamily ||
          brandingSource.fontFamily ||
          brandingSource?.header?.brandFontFamily ||
          brandingSource?.pdf?.brandFontFamily ||
          DEFAULT_FONT_FAMILY,
      ),
    );

    return {
      logoUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      fontFamily,
    };
  }

  private buildMergedBranding(
    salon: SalonEntity,
    payload: BrandingPayload,
    metadata?: {
      presetId?: string;
      presetSegment?: string;
      presetLabel?: string;
    },
  ) {
    const current =
      salon.branding && typeof salon.branding === 'object'
        ? salon.branding
        : {};
    const header =
      current?.header && typeof current.header === 'object'
        ? current.header
        : {};
    const pdf =
      current?.pdf && typeof current.pdf === 'object' ? current.pdf : {};

    return {
      ...current,
      logoUrl: payload.logoUrl || undefined,
      brandPrimaryColor: payload.primaryColor,
      brandSecondaryColor: payload.secondaryColor,
      brandAccentColor: payload.accentColor,
      brandFontFamily: payload.fontFamily,
      presetId: metadata?.presetId || 'custom',
      presetSegment: metadata?.presetSegment,
      presetLabel: metadata?.presetLabel || 'Custom',
      header: {
        ...header,
        logoUrl: payload.logoUrl || undefined,
        brandPrimaryColor: payload.primaryColor,
        brandSecondaryColor: payload.secondaryColor,
        brandAccentColor: payload.accentColor,
        brandFontFamily: payload.fontFamily,
      },
      pdf: {
        ...pdf,
        logoUrl: payload.logoUrl || undefined,
        brandPrimaryColor: payload.primaryColor,
        brandSecondaryColor: payload.secondaryColor,
        brandAccentColor: payload.accentColor,
        brandFontFamily: payload.fontFamily,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  private normalizeHexColor(
    value: string,
    fieldName: string,
    fallback?: string,
  ): string {
    const raw = String(value || '').trim();
    if (!raw) {
      if (fallback) return fallback;
      throw new BadRequestException(`${fieldName} \u00e9 obrigat\u00f3rio`);
    }
    const withHash = raw.startsWith('#') ? raw : `#${raw}`;
    if (!/^#[0-9a-fA-F]{6}$/.test(withHash)) {
      if (fallback) return fallback;
      throw new BadRequestException(
        `${fieldName} deve estar no formato #RRGGBB`,
      );
    }
    return withHash.toUpperCase();
  }

  private normalizeFontFamily(value: string): SupportedFontFamily {
    const raw = String(value || '')
      .trim()
      .toLowerCase();

    if (
      raw.includes('times') ||
      raw.includes('serif') ||
      raw.includes('roman')
    ) {
      return 'times';
    }
    if (raw.includes('courier') || raw.includes('mono')) {
      return 'courier';
    }
    return 'helvetica';
  }

  private normalizeLogoUrl(value: string): string | null {
    const raw = String(value || '').trim();
    if (!raw) return null;

    if (/^data:image\/(png|jpeg|jpg|webp);base64,[a-zA-Z0-9+/=]+$/i.test(raw)) {
      const maxLength = 1024 * 1024 * 2.8;
      if (raw.length > maxLength) {
        throw new BadRequestException(
          'Logo excede o tamanho m\u00e1ximo permitido',
        );
      }
      return raw;
    }

    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }

    if (raw.startsWith('/uploads/') || raw.startsWith('uploads/')) {
      return raw;
    }

    throw new BadRequestException(
      'logoUrl deve ser URL HTTP(S), caminho de upload ou data URL de imagem',
    );
  }

  private findPresetOrFail(presetId: string): BrandingPreset {
    const normalized = String(presetId || '')
      .trim()
      .toLowerCase();
    const preset = BRANDING_PRESETS.find((item) => item.id === normalized);
    if (!preset) {
      throw new BadRequestException('Preset de branding inv\u00e1lido');
    }
    return preset;
  }
}
