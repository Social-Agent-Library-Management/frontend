"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast, type ToastTone } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/client";
import { createBook, DUPLICATE_ISBN_CODE, type Book } from "@/lib/api/books";

export interface BookRegisterFormProps {
  /** 등록 성공 시 호출 (목록 refetch 트리거) */
  onCreated?: (book: Book) => void;
  /** Card에 전달되는 클래스 */
  className?: string;
}

type BookRegisterFormValues = {
  title: string;
  author: string;
  publisher: string;
  isbn: string;
};

const EMPTY_VALUES: BookRegisterFormValues = {
  title: "",
  author: "",
  publisher: "",
  isbn: "",
};

type ToastState = { open: boolean; tone: ToastTone; message: string };

const CLOSED_TOAST: ToastState = {
  open: false,
  tone: "success",
  message: "",
};

/**
 * 도서 등록 폼.
 *
 * 필수 검증은 네이티브 `required`에 맡긴다(별도 검증 라이브러리 없음).
 * 409(DUPLICATE_ISBN)만 ISBN 필드 에러로 내리고, 나머지 실패는 토스트로 알린다.
 */
export function BookRegisterForm({
  onCreated,
  className,
}: BookRegisterFormProps) {
  const [values, setValues] =
    React.useState<BookRegisterFormValues>(EMPTY_VALUES);
  const [submitting, setSubmitting] = React.useState(false);
  const [isbnError, setIsbnError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<ToastState>(CLOSED_TOAST);

  function updateField(field: keyof BookRegisterFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    // 수정 중에 옛 에러가 남지 않게 즉시 되돌린다.
    if (field === "isbn") setIsbnError(null);
  }

  function handleReset() {
    setValues(EMPTY_VALUES);
    setIsbnError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setIsbnError(null);

    const isbn = values.isbn.trim();
    try {
      const book = await createBook({
        title: values.title.trim(),
        author: values.author.trim(),
        publisher: values.publisher.trim(),
        isbn: isbn === "" ? null : isbn,
      });
      setValues(EMPTY_VALUES);
      setToast({
        open: true,
        tone: "success",
        message: "도서가 등록되었습니다.",
      });
      onCreated?.(book);
    } catch (error) {
      if (isApiError(error) && error.code === DUPLICATE_ISBN_CODE) {
        // 필드 에러로만 내린다 — 토스트는 띄우지 않는다.
        setIsbnError(error.detail);
      } else {
        setToast({
          open: true,
          tone: "danger",
          message: isApiError(error)
            ? error.detail
            : "도서 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="새 도서 등록" titleAs="h2" className={className}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Input
            label="도서명"
            required
            value={values.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="도서명을 입력하세요"
            autoComplete="off"
          />
          <Input
            label="저자"
            required
            value={values.author}
            onChange={(e) => updateField("author", e.target.value)}
            placeholder="저자를 입력하세요"
            autoComplete="off"
          />
          <Input
            label="출판사"
            required
            value={values.publisher}
            onChange={(e) => updateField("publisher", e.target.value)}
            placeholder="출판사를 입력하세요"
            autoComplete="off"
          />
          <Input
            label="ISBN"
            value={values.isbn}
            onChange={(e) => updateField("isbn", e.target.value)}
            hint="13자리 ISBN을 입력하세요"
            error={isbnError ?? undefined}
            inputMode="numeric"
            autoComplete="off"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={submitting}
          >
            초기화
          </Button>
          {/* Button의 type 기본값이 "button"이라 제출 버튼에는 반드시 명시한다. */}
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? "등록 중…" : "등록"}
          </Button>
        </div>
      </form>

      <Toast
        open={toast.open}
        tone={toast.tone}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </Card>
  );
}
