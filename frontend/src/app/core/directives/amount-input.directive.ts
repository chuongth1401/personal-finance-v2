import {
  Directive,
  ElementRef,
  HostListener,
  Renderer2,
  afterNextRender,
  forwardRef,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const vndGroupFormatter = new Intl.NumberFormat('vi-VN');
const CARET_BLINK_STYLE_ID = 'app-amount-input-caret-style';

interface AmountModel {
  negative: boolean;
  digits: string;
}

/** Các style cần sao chép từ input thật sang lớp overlay để chữ khớp vị trí pixel-cho-pixel. */
const OVERLAY_STYLE_PROPS = [
  'padding-left',
  'padding-right',
  'padding-top',
  'padding-bottom',
  'font-size',
  'font-family',
  'font-weight',
  'font-style',
  'letter-spacing',
  'line-height',
] as const;

/**
 * Gắn vào <input> để hiển thị dấu chấm ngăn cách hàng nghìn khi gõ số tiền
 * (vd. 1.000.000), trong khi FormControl phía sau vẫn giữ giá trị number
 * thuần (1000000) - không cần đổi validators/kiểu dữ liệu ở nơi dùng.
 *
 * Bàn phím tiếng Việt (Windows Vietnamese IME, Unikey...) có thể giữ một
 * phiên composition mở suốt cả quá trình gõ số và chỉ đóng lúc mất focus.
 * Theo đặc tả, không có cách nào ghi đè value/con trỏ của input trong lúc
 * composition đang mở mà không làm hỏng phiên gõ đó, nên input thật không
 * bao giờ bị ghi đè trong lúc đang gõ - nó nhận ký tự thô hoàn toàn tự
 * nhiên, chữ được set trong suốt (người dùng không thấy số chưa định dạng),
 * còn một lớp <span> phủ lên trên hiển thị bản đã có dấu chấm.
 *
 * Vì input thật (chuỗi thô, không dấu chấm) và overlay (chuỗi đã định dạng,
 * nhiều ký tự hơn) không cùng độ dài, con trỏ nhấp nháy MẶC ĐỊNH của trình
 * duyệt (vẽ theo vị trí trong chuỗi thô) sẽ lệch dần sang trái so với overlay
 * khi số dấu chấm tăng lên. Để khắc phục, con trỏ gốc bị ẩn (`caret-color:
 * transparent`) và một con trỏ giả được tự vẽ, tính vị trí dựa trên SỐ CHỮ
 * SỐ đứng trước con trỏ thật (không phụ thuộc dấu chấm nằm ở đâu) rồi đo
 * bằng pixel trên chính overlay.
 */
@Directive({
  selector: 'input[appAmountInput]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AmountInputDirective),
      multi: true,
    },
  ],
  host: {
    inputmode: 'numeric',
    autocomplete: 'off',
    spellcheck: 'false',
    '(input)': 'handleInput($event)',
    '(blur)': 'handleBlur()',
    '(focus)': 'updateCaret()',
    '(keyup)': 'updateCaret()',
    '(click)': 'updateCaret()',
  },
})
export class AmountInputDirective implements ControlValueAccessor {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};
  private overlay: HTMLSpanElement | null = null;
  private caret: HTMLSpanElement | null = null;
  private ruler: HTMLSpanElement | null = null;
  private paddingLeftPx = 0;

  constructor() {
    afterNextRender(() => this.setupOverlay());
  }

  private setupOverlay(): void {
    const input = this.el.nativeElement;
    const parent = input.parentElement;
    if (!parent) return;

    this.ensureCaretBlinkStyle();

    const wrapper = this.renderer.createElement('span') as HTMLSpanElement;
    this.renderer.setStyle(wrapper, 'position', 'relative');
    this.renderer.setStyle(wrapper, 'display', 'block');
    this.renderer.setStyle(wrapper, 'width', '100%');
    this.renderer.insertBefore(parent, wrapper, input);
    this.renderer.appendChild(wrapper, input);

    const overlay = this.renderer.createElement('span') as HTMLSpanElement;
    this.renderer.setAttribute(overlay, 'aria-hidden', 'true');
    this.renderer.setStyle(overlay, 'position', 'absolute');
    this.renderer.setStyle(overlay, 'inset', '0');
    this.renderer.setStyle(overlay, 'display', 'flex');
    this.renderer.setStyle(overlay, 'align-items', 'center');
    this.renderer.setStyle(overlay, 'pointer-events', 'none');
    this.renderer.setStyle(overlay, 'white-space', 'pre');
    this.renderer.setStyle(overlay, 'overflow', 'hidden');
    this.renderer.setStyle(overlay, 'box-sizing', 'border-box');
    this.renderer.setStyle(overlay, 'color', '#0f172a');

    const computed = getComputedStyle(input);
    for (const prop of OVERLAY_STYLE_PROPS) {
      this.renderer.setStyle(overlay, prop, computed.getPropertyValue(prop));
    }
    this.paddingLeftPx = parseFloat(computed.getPropertyValue('padding-left')) || 0;

    this.renderer.appendChild(wrapper, overlay);

    // Span đo lường ẩn - cùng font với overlay, dùng để tính độ rộng pixel của
    // đoạn text đứng trước con trỏ, phục vụ định vị con trỏ giả.
    const ruler = this.renderer.createElement('span') as HTMLSpanElement;
    this.renderer.setStyle(ruler, 'position', 'absolute');
    this.renderer.setStyle(ruler, 'visibility', 'hidden');
    this.renderer.setStyle(ruler, 'white-space', 'pre');
    this.renderer.setStyle(ruler, 'top', '0');
    this.renderer.setStyle(ruler, 'left', '0');
    for (const prop of OVERLAY_STYLE_PROPS) {
      this.renderer.setStyle(ruler, prop, computed.getPropertyValue(prop));
    }
    this.renderer.setStyle(ruler, 'padding', '0');
    this.renderer.appendChild(wrapper, ruler);

    const caret = this.renderer.createElement('span') as HTMLSpanElement;
    this.renderer.setStyle(caret, 'position', 'absolute');
    this.renderer.setStyle(caret, 'top', '50%');
    this.renderer.setStyle(caret, 'width', '1px');
    this.renderer.setStyle(caret, 'height', '1.15em');
    this.renderer.setStyle(caret, 'font-size', computed.getPropertyValue('font-size'));
    this.renderer.setStyle(caret, 'background-color', '#0f172a');
    this.renderer.setStyle(caret, 'transform', 'translateY(-50%)');
    this.renderer.setStyle(caret, 'pointer-events', 'none');
    this.renderer.setStyle(caret, 'display', 'none');
    this.renderer.setStyle(caret, 'animation', 'app-amount-input-caret-blink 1s step-end infinite');
    this.renderer.appendChild(wrapper, caret);

    this.renderer.setStyle(input, 'position', 'relative');
    this.renderer.setStyle(input, 'width', '100%');
    this.renderer.setStyle(input, 'background', 'transparent');
    this.renderer.setStyle(input, 'color', 'transparent');
    this.renderer.setStyle(input, 'caret-color', 'transparent');

    this.overlay = overlay;
    this.ruler = ruler;
    this.caret = caret;
    this.syncOverlay(input.value);
  }

  private ensureCaretBlinkStyle(): void {
    if (document.getElementById(CARET_BLINK_STYLE_ID)) return;
    const style = this.renderer.createElement('style') as HTMLStyleElement;
    style.id = CARET_BLINK_STYLE_ID;
    style.textContent =
      '@keyframes app-amount-input-caret-blink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }';
    this.renderer.appendChild(document.head, style);
  }

  protected handleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.syncOverlay(input.value);
    this.updateCaret();
    this.onChange(this.parse(input.value));
  }

  protected handleBlur(): void {
    this.onTouched();
    if (this.caret) this.renderer.setStyle(this.caret, 'display', 'none');

    const input = this.el.nativeElement;
    const formatted = this.format(input.value);
    this.renderer.setProperty(input, 'value', formatted);
    this.syncOverlay(formatted);
  }

  /** Tính lại và vẽ vị trí con trỏ giả dựa trên số chữ số đứng trước con trỏ thật. */
  protected updateCaret(): void {
    const input = this.el.nativeElement;
    if (!this.caret || !this.ruler || !this.overlay) return;
    if (document.activeElement !== input) {
      this.renderer.setStyle(this.caret, 'display', 'none');
      return;
    }

    const rawValue = input.value;
    const cursorPos = input.selectionStart ?? rawValue.length;
    const digitsBeforeCursor = this.countDigits(rawValue.slice(0, cursorPos));

    const formatted = this.format(rawValue);
    const charIndex = this.positionAfterDigits(formatted, digitsBeforeCursor);

    this.renderer.setProperty(this.ruler, 'textContent', formatted.slice(0, charIndex));
    const textWidth = this.ruler.getBoundingClientRect().width;

    this.renderer.setStyle(this.caret, 'left', `${this.paddingLeftPx + textWidth}px`);
    this.renderer.setStyle(this.caret, 'display', 'block');
    // Khởi động lại animation để con trỏ hiện ngay (không nhấp nháy dở dang) mỗi lần gõ.
    this.renderer.setStyle(this.caret, 'animation', 'none');
    void this.caret.offsetWidth;
    this.renderer.setStyle(this.caret, 'animation', 'app-amount-input-caret-blink 1s step-end infinite');
  }

  writeValue(value: number | null): void {
    const formatted =
      value === null || value === undefined || Number.isNaN(value)
        ? ''
        : vndGroupFormatter.format(value);
    this.renderer.setProperty(this.el.nativeElement, 'value', formatted);
    this.syncOverlay(formatted);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.renderer.setProperty(this.el.nativeElement, 'disabled', isDisabled);
  }

  private syncOverlay(raw: string): void {
    if (!this.overlay) return;
    const formatted = this.format(raw);
    this.renderer.setProperty(this.overlay, 'textContent', formatted || ' ');
  }

  /** Cho phép tối đa 1 dấu trừ ở đầu (số dư tài khoản có thể âm) + chữ số. */
  private split(raw: string): AmountModel {
    return { negative: raw.trim().startsWith('-'), digits: raw.replace(/[^0-9]/g, '') };
  }

  private toNumber(model: AmountModel): number | null {
    if (!model.digits) return null;
    const value = Number(model.digits);
    return model.negative ? -value : value;
  }

  private parse(raw: string): number | null {
    return this.toNumber(this.split(raw));
  }

  private format(raw: string): string {
    const model = this.split(raw);
    if (!model.digits) return model.negative ? '-' : '';
    return (model.negative ? '-' : '') + vndGroupFormatter.format(Number(model.digits));
  }

  private countDigits(text: string): number {
    return (text.match(/[0-9]/g) ?? []).length;
  }

  /** Vị trí ký tự ngay sau chữ số thứ N trong chuỗi đã định dạng (dùng để đặt con trỏ giả). */
  private positionAfterDigits(formatted: string, digitCount: number): number {
    const signLength = formatted.startsWith('-') ? 1 : 0;
    if (digitCount <= 0) return signLength;

    let seen = 0;
    for (let i = signLength; i < formatted.length; i++) {
      if (/[0-9]/.test(formatted[i])) {
        seen++;
        if (seen >= digitCount) return i + 1;
      }
    }
    return formatted.length;
  }
}
